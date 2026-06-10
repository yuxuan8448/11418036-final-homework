import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  isOpen: boolean;
}

export default function AuthModal({ onSuccess, isOpen }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(true);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('登入視窗已被關閉。\n\n💡 建議：由於預覽視窗運行在內嵌的 iframe 中，瀏覽器可能會自動阻擋彈出視窗。請點擊預覽右上角「在新分頁中開啟 (Open in new tab)」按鈕，在獨立分頁中打開此應用，即可更順暢地完成 Google 登入！');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('請確認已在 Firebase Console 啟用 Google 驗證服務。');
      } else {
        setError(err.message || 'Google 登入失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('請填寫所有必要欄位。');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密碼長度至少需 6 個字元。');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        if (!displayName) {
          setError('請輸入顯示名稱。');
          setLoading(false);
          return;
        }
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errCode = err.code || '';
      const errMsg = err.message || '';
      
      if (errCode === 'auth/email-already-in-use') {
        setError('此電子郵件已被註冊。如果您先前已建立帳號，請直接使用登入功能。');
      } else if (errCode === 'auth/invalid-credential' || errMsg.includes('invalid-credential')) {
        setError('電子郵件或密碼不正確，或該帳號尚未建立。\n\n💡 提示：若您當初是以「Google 帳號」建立此手帳，請直接點選下方 Google 登入按鈕。另外，請確保密碼輸入正確。');
      } else if (errCode === 'auth/user-not-found') {
        setError('找不到此電子郵件對應的使用者帳號，請先切換至「註冊新帳號」。');
      } else if (errCode === 'auth/wrong-password') {
        setError('密碼輸入錯誤，請重新確認。');
      } else if (errCode === 'auth/too-many-requests') {
        setError('此帳號因嘗試登入失敗次數過多已被暫時鎖定，請稍後再試或重設密碼。');
      } else if (errCode === 'auth/operation-not-allowed') {
        setError('請於 Firebase Console 啟用「電子郵件/密碼」與「Google」認證服務。');
      } else if (errCode === 'auth/weak-password') {
        setError('密碼強度不足，請建立至少 6 位字元的英文或數字密碼。');
      } else {
        setError(errMsg || '驗證失敗，請再嘗試一次或聯絡開發人員。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a4a3a]/30 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden bg-white rounded-2xl border border-natural-border shadow-2xl"
        id="auth-modal-card"
      >
        {/* Brand Banner */}
        <div className="px-6 pt-8 pb-4 text-center bg-[#f2f1e9] border-b border-natural-border">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-natural-primary mb-3 text-white shadow-sm">
            木
          </div>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-natural-dark">
            日系手帳：時間規劃系統
          </h2>
          <p className="mt-1.5 text-xs text-natural-light font-sans font-light">
            {isRegister ? '新規登録 • 註冊新帳號' : 'お帰りなさい • 歡迎回來'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 mb-4 text-xs font-sans text-red-600 bg-red-50/50 rounded-lg border border-red-100 whitespace-pre-line"
              id="auth-error-banner"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-natural-text">顯示名稱 (名前)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-light" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="例如：山田太郎"
                    className="w-full pl-9 pr-4 py-2 text-sm font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-natural-text">電子郵件 (メール)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-light" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2 text-sm font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-natural-text">密碼 (パスワード)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-light" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位字元"
                  className="w-full pl-9 pr-4 py-2 text-sm font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium text-white bg-natural-primary hover:bg-natural-primary-hover active:bg-[#4d4d38] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              id="auth-submit-button"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-natural-border border-t-white rounded-full animate-spin"></span>
              ) : isRegister ? (
                <>
                  <UserPlus size={16} />
                  <span>註冊新帳號</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>登入系統</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-natural-border"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase text-natural-muted tracking-wider">或使用社群登入</span>
            <div className="flex-grow border-t border-natural-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-natural-dark bg-white border border-natural-border rounded-lg hover:bg-natural-badge hover:border-natural-muted/65 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            id="google-signin-button"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>使用 Google 帳號登入</span>
          </button>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-medium text-natural-light hover:text-natural-dark transition-colors underline decoration-dotted underline-offset-4"
            >
              {isRegister ? '已有手帳帳號？立即登入' : '還沒有手帳帳號？註冊新用戶'}
            </button>
          </div>
        </div>

        {/* Development Helper / Instruction Guideline box */}
        <AnimatePresence>
          {showConfigGuide && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#f5f5f0] border-t border-natural-border p-4 shrink-0"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-natural-dark">【開發者提醒 / 註冊指引】</h4>
                  <p className="text-[11px] text-natural-text leading-relaxed font-sans">
                    為能正常使用登入功能，請確保：
                  </p>
                  <ul className="list-disc pl-3.5 text-[11px] text-natural-light space-y-0.5">
                    <li>Firebase Console 中已啟用「電子郵件/密碼」登入服務。</li>
                    <li>Firebase Console 中已啟用「Google」社群認證，並完成 Web 全域配置。</li>
                    <li>若 Google 彈出視窗被阻擋，請點擊瀏覽器網址列右側的允許彈出視窗權限。</li>
                  </ul>
                  <button 
                    onClick={() => setShowConfigGuide(false)}
                    className="text-[10px] font-semibold text-natural-muted hover:text-natural-light pt-1 block"
                  >
                    關閉提醒
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
