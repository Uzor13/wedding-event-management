'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from 'sonner';
import {
  QrCode, CheckCircle, XCircle, User, Phone, Tag,
  KeyRound, Camera, Keyboard, AlertCircle
} from 'lucide-react';

interface VerifiedGuest {
  name: string;
  phoneNumber: string;
  code: string;
  uniqueId: string;
  rsvpStatus: boolean;
  isUsed: boolean;
  tags?: { name: string; color: string }[];
}

export default function VerifyGuest() {
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedGuest, setVerifiedGuest] = useState<VerifiedGuest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couples, setCouples] = useState<any[]>([]);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const router = useRouter();
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const loadCouples = async () => {
      if (!isAdmin) return;
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCouples(response.data);
        if (!selectedCoupleId && response.data.length > 0) {
          setSelectedCoupleId(response.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId, router]);

  const verifyGuest = async (codeOrId: string, isUniqueId: boolean = false) => {
    if (!codeOrId.trim()) {
      setError('Please provide a code or unique ID');
      return;
    }

    setVerifying(true);
    setError(null);
    setVerifiedGuest(null);

    try {
      const payload: any = {
        coupleId: currentCoupleId
      };

      // Send as uniqueId if from QR code, otherwise as code
      if (isUniqueId) {
        payload.uniqueId = codeOrId;
      } else {
        payload.code = codeOrId;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/verify-guest`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVerifiedGuest(response.data);

      // Always show success since we have guest data
      if (response.data.isUsed) {
        toast.info('Guest found - Previously verified');
      } else {
        toast.success('Guest verified successfully!');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed';
      setError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleScan = (result: string) => {
    if (result && !verifying) {
      // Extract code/uniqueId from QR code data
      // The QR code might contain the full URL or just the code
      let uniqueId = result;
      let isUniqueId = false;

      // If it's a URL, extract the uniqueId
      if (result.includes('/rsvp/')) {
        const parts = result.split('/rsvp/');
        uniqueId = parts[parts.length - 1];
        isUniqueId = true;
      }

      verifyGuest(uniqueId, isUniqueId);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyGuest(manualCode);
  };

  const resetVerification = () => {
    setVerifiedGuest(null);
    setError(null);
    setManualCode('');
  };

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Verify Guest</h1>
          </div>
          <p className="text-gray-600">Scan QR code or enter verification code manually</p>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Couple
            </label>
            <select
              value={selectedCoupleId || ''}
              onChange={(e) => {
                setSelectedCoupleId(e.target.value);
                resetVerification();
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select couple</option>
              {couples.map((couple) => (
                <option key={couple.id} value={couple.id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(!isAdmin || currentCoupleId) ? (
          <div className="space-y-6">
            {/* Input Mode Toggle */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInputMode('scan');
                    resetVerification();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    inputMode === 'scan'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </button>
                <button
                  onClick={() => {
                    setInputMode('manual');
                    resetVerification();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Keyboard className="w-5 h-5" />
                  Enter Manually
                </button>
              </div>
            </div>

            {/* Scanner/Manual Input */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              {inputMode === 'scan' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">QR Code Scanner</h2>
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>

                  {scannerError ? (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-700 font-medium mb-2">Camera Access Error</p>
                      <p className="text-sm text-red-600">{scannerError}</p>
                      <button
                        onClick={() => setInputMode('manual')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Use Manual Entry Instead
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 aspect-square max-w-md mx-auto">
                      <Scanner
                        onScan={(result) => {
                          if (result && result[0]) {
                            handleScan(result[0].rawValue);
                          }
                        }}
                        onError={(error) => {
                          console.error('Scanner error:', error);
                          setScannerError(
                            'Unable to access camera. Please check permissions or use manual entry.'
                          );
                        }}
                        components={{
                          finder: true
                        }}
                        styles={{
                          container: { width: '100%', height: '100%' }
                        }}
                      />
                      {verifying && (
                        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
                          <Spinner size="lg" />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 text-center mt-4">
                    Position the QR code within the frame to scan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Manual Entry</h2>
                    <KeyRound className="w-5 h-5 text-blue-600" />
                  </div>

                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code or Unique ID
                      </label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter 4-digit code or unique ID"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifying || !manualCode.trim()}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {verifying ? (
                        <>
                          <Spinner size="sm" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Verify Guest
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Verification Result */}
            {(verifiedGuest || error) && (
              <div
                className={`p-6 rounded-xl shadow-sm border-2 ${
                  verifiedGuest
                    ? verifiedGuest.isUsed
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                {verifiedGuest ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {verifiedGuest.isUsed ? (
                        <>
                          <AlertCircle className="w-8 h-8 text-yellow-600" />
                          <div>
                            <h3 className="text-xl font-bold text-yellow-900">
                              Already Verified
                            </h3>
                            <p className="text-yellow-700">This guest has been verified previously</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <div>
                            <h3 className="text-xl font-bold text-green-900">
                              Verification Successful!
                            </h3>
                            <p className="text-green-700">Guest has been verified for entry</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Name:</span>
                        <span className="font-semibold">{verifiedGuest.name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Phone:</span>
                        <span>{verifiedGuest.phoneNumber}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <KeyRound className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Code:</span>
                        <span className="font-mono font-semibold">{verifiedGuest.code}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">RSVP Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            verifiedGuest.rsvpStatus
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {verifiedGuest.rsvpStatus ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>

                      {verifiedGuest.tags && verifiedGuest.tags.length > 0 && (
                        <div className="flex items-start gap-2 text-gray-700">
                          <Tag className="w-5 h-5 text-blue-600 mt-1" />
                          <div>
                            <span className="font-medium">Tags:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {verifiedGuest.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 rounded text-sm"
                                  style={{
                                    backgroundColor: tag.color || '#e5e7eb',
                                    color: '#1f2937'
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={resetVerification}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Verify Another Guest
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <div>
                        <h3 className="text-xl font-bold text-red-900">Verification Failed</h3>
                        <p className="text-red-700">{error}</p>
                      </div>
                    </div>

                    <button
                      onClick={resetVerification}
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Couple Selected</h3>
            <p className="text-gray-600">Please select a couple to verify guests</p>
          </div>
        )}
      </div>
    </>
  );
}
