from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import os
import httpx
from datetime import datetime
from app.database import get_db
from app.models import User, AIConfig, AuditLog
from app.schemas import AIConfigUpdate, AIConfigResponse, AIConnectionTest
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/ai-config", tags=["AI Configuration"])

# Encryption key - load from environment variable
# IMPORTANT: Once set, DO NOT change this key or existing encrypted API keys will become invalid
def get_fernet():
    from dotenv import load_dotenv
    load_dotenv()
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("ENCRYPTION_KEY not set in environment. Please create backend/.env file.")
    return Fernet(key.encode())

_fernet_instance = None

def get_fernet_instance():
    global _fernet_instance
    if _fernet_instance is None:
        _fernet_instance = get_fernet()
    return _fernet_instance


def encrypt_api_key(api_key: str) -> str:
    return get_fernet_instance().encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    return get_fernet_instance().decrypt(encrypted.encode()).decode()


@router.get("", response_model=AIConfigResponse)
def get_ai_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    config = db.query(AIConfig).first()
    if not config:
        return AIConfigResponse(
            base_url=None,
            model_name=None,
            has_api_key=False,
            ocr_enabled=True
        )
    
    return AIConfigResponse(
        base_url=config.base_url,
        model_name=config.model_name,
        has_api_key=bool(config.api_key_encrypted),
        ocr_enabled=config.ocr_enabled
    )


@router.put("", response_model=AIConfigResponse)
def update_ai_config(
    config_data: AIConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    config = db.query(AIConfig).first()
    
    if not config:
        config = AIConfig(id=1)
        db.add(config)
    
    if config_data.base_url is not None:
        config.base_url = config_data.base_url
    
    if config_data.model_name is not None:
        config.model_name = config_data.model_name
    
    if config_data.api_key is not None:
        config.api_key_encrypted = encrypt_api_key(config_data.api_key)
    
    if config_data.ocr_enabled is not None:
        config.ocr_enabled = config_data.ocr_enabled
    
    config.updated_by = current_user.id
    config.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(config)
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="update_ai_config",
        target_type="ai_config",
        target_id=1,
        details="Updated AI configuration"
    )
    db.add(audit)
    db.commit()
    
    return AIConfigResponse(
        base_url=config.base_url,
        model_name=config.model_name,
        has_api_key=bool(config.api_key_encrypted),
        ocr_enabled=config.ocr_enabled
    )


@router.get("/ocr-setting")
def get_ocr_setting(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OCR setting - available to all authenticated users"""
    config = db.query(AIConfig).first()
    
    return {
        "ocr_enabled": config.ocr_enabled if config else True
    }


@router.post("/test", response_model=AIConnectionTest)
async def test_ai_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    config = db.query(AIConfig).first()
    
    if not config or not config.base_url:
        return AIConnectionTest(
            success=False,
            message="AI configuration not set. Please configure base URL first."
        )
    
    if not config.api_key_encrypted:
        return AIConnectionTest(
            success=False,
            message="API key not configured. Please set API key first."
        )
    
    api_key = decrypt_api_key(config.api_key_encrypted)
    model_name = config.model_name or "default"
    
    try:
        import time
        start_time = time.time()
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 5
                }
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                return AIConnectionTest(
                    success=True,
                    message="Connection successful",
                    latency_ms=latency_ms
                )
            else:
                return AIConnectionTest(
                    success=False,
                    message=f"API returned status {response.status_code}: {response.text[:100]}"
                )
                
    except httpx.TimeoutException:
        return AIConnectionTest(
            success=False,
            message="Connection timeout. Please check the base URL and try again."
        )
    except httpx.ConnectError:
        return AIConnectionTest(
            success=False,
            message="Could not connect to the API. Please check the base URL."
        )
    except Exception as e:
        return AIConnectionTest(
            success=False,
            message=f"Error: {str(e)}"
        )


@router.post("/extract")
async def extract_receipt_data(
    image_base64: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract data from receipt image using AI"""
    config = db.query(AIConfig).first()
    
    if not config or not config.base_url:
        return {
            "success": False,
            "error": "AI configuration not set"
        }
    
    if not config.api_key_encrypted:
        return {
            "success": False,
            "error": "API key not configured"
        }
    
    api_key = decrypt_api_key(config.api_key_encrypted)
    model_name = config.model_name or "default"
    
    # Check if this is Gemini API by looking at model name
    is_gemini = "gemini" in model_name.lower()
    
    prompt = """Extract information from this receipt image. Return a JSON object with these fields:
- merchant_name: the store or merchant name
- transaction_date: date in YYYY-MM-DD format
- amount: the total amount paid (just the number)
- category: one of [Makanan, Transport, Akomodasi, Lain-lain]
- receipt_number: the receipt/invoice number if visible
- description: brief description of items purchased

Return ONLY valid JSON, no markdown or extra text. Example: {"merchant_name":"Toko ABC","transaction_date":"2025-05-10","amount":50000,"category":"Makanan","description":"Makan siang","receipt_number":"12345"}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Check if this is a custom OpenAI-compatible API (base_url ends with /v1)
            is_openai_compatible = "/v1" in config.base_url or "/v1beta" in config.base_url
            
            if is_gemini and not is_openai_compatible:
                # Gemini API format (only for actual Google Gemini APIs)
                response = await client.post(
                    f"{config.base_url.rstrip('/')}/models/{model_name}:generateContent",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "contents": [{
                            "parts": [
                                {"text": prompt},
                                {"inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_base64
                                }}
                            ]
                        }],
                        "generation_config": {
                            "temperature": 0.1,
                            "max_output_tokens": 1000
                        }
                    }
                )
            else:
                # OpenAI-compatible format (works with custom proxies and OpenAI)
                # Remove "gemini/" prefix if present for OpenAI-compatible APIs
                model_for_api = model_name.replace("gemini/", "") if "gemini" in model_name.lower() else model_name
                response = await client.post(
                    f"{config.base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model_for_api,
                        "messages": [
                            {"role": "user", "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                            ]}
                        ],
                        "max_tokens": 500
                    }
                )
            
            if response.status_code == 200:
                data = response.json()
                
                # Parse response based on API type
                if is_gemini:
                    # Gemini response format
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                    else:
                        content = "{}"
                else:
                    # OpenAI response format
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                
                # Clean markdown formatting if present
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                import json
                try:
                    result = json.loads(content)
                    return {
                        "success": True,
                        "data": result
                    }
                except json.JSONDecodeError as e:
                    return {
                        "success": False,
                        "error": f"Failed to parse AI response: {str(e)}, content: {content[:100]}"
                    }
            else:
                return {
                    "success": False,
                    "error": f"API error: {response.status_code} - {response.text[:200]}"
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
