'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { aiConfigAPI } from '@/lib/api';
import type { AIConfig } from '@/lib/types';

export default function AISettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    base_url: '',
    model_name: '',
    api_key: '',
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await aiConfigAPI.get();
      setConfig(response.data);
      setFormData({
        base_url: response.data.base_url || '',
        model_name: response.data.model_name || '',
        api_key: '',
      });
    } catch (err) {
      console.error('Failed to load AI config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await aiConfigAPI.update({
        base_url: formData.base_url || undefined,
        model_name: formData.model_name || undefined,
        api_key: formData.api_key || undefined,
      });
      alert('Konfigurasi berhasil disimpan');
      loadConfig();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await aiConfigAPI.test();
      setTestResult({ success: response.data.success, message: response.data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.detail || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[700px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Pengaturan AI
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Konfigurasi koneksi ke AI API untuk receipt scanning
            </p>
          </div>

          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat konfigurasi...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-bg-surface border border-border-default rounded-radius-lg p-6 space-y-6">
              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Base URL API
                </label>
                <Input
                  placeholder="https://api.openai.com/v1"
                  value={formData.base_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
                />
                <p className="text-text-muted text-xs mt-1">
                  URL endpoint untuk API AI (contoh: OpenAI, Anthropic, dll)
                </p>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Model Name
                </label>
                <Input
                  placeholder="gpt-4o-mini"
                  value={formData.model_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                />
                <p className="text-text-muted text-xs mt-1">
                  Nama model AI yang digunakan (contoh: gpt-4o-mini, claude-3-haiku)
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder={config?.has_api_key ? '•••••••• (tersimpan)' : 'Masukkan API key'}
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                />
                <p className="text-text-muted text-xs mt-1">
                  {config?.has_api_key 
                    ? 'API key sudah tersimpan. Kosongkan jika tidak ingin mengubah.'
                    : 'API key akan dienkripsi sebelum disimpan.'}
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-radius-md ${
                  testResult.success ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'
                }`}>
                  <p className={testResult.success ? 'text-success' : 'text-danger'}>
                    {testResult.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTest}
                  isLoading={testing}
                >
                  Test Koneksi
                </Button>
                <Button type="submit" isLoading={saving}>
                  Simpan Konfigurasi
                </Button>
              </div>
            </form>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-bg-subtle rounded-radius-lg">
            <h3 className="font-medium text-text-primary mb-2">Cara Kerja AI Receipt Scanning</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Gambar receipt diupload dan dikonversi ke Base64</li>
              <li>• Dikirim ke API AI yang dikonfigurasi</li>
              <li>• AI mengekstrak informasi: merchant, tanggal, jumlah, dll</li>
              <li>• Data hasil ekstraksi digunakan untuk pre-fill form klaim</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}