'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SimpleAuthProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export function SimpleAuth({ isOpen, onClose, mode, onModeChange }: SimpleAuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'login') {
        // Basit login - demo amaçlı
        if (email && password) {
          login({
            id: '1',
            email,
            name: name || email.split('@')[0],
            avatar: null
          })
          toast.success('Giriş başarılı!')
          onClose()
        } else {
          toast.error('Email ve şifre gerekli')
        }
      } else {
        // Basit register - demo amaçlı
        if (email && password && name) {
          login({
            id: '1',
            email,
            name,
            avatar: null
          })
          toast.success('Hesap oluşturuldu ve giriş yapıldı!')
          onClose()
        } else {
          toast.error('Tüm alanları doldurun')
        }
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    login({
      id: 'guest',
      email: 'guest@demo.com',
      name: 'Misafir Kullanıcı',
      avatar: null
    })
    toast.success('Misafir modunda giriş yapıldı!')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'login' 
              ? 'İş başvuru takipçinize hoş geldiniz' 
              : 'Yeni hesabınızı oluşturun'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınızı girin"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                İşleniyor...
              </div>
            ) : (
              mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'
            )}
          </Button>

          {/* Guest Mode */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGuestMode}
          >
            Misafir Olarak Devam Et
          </Button>
        </form>

        {/* Mode Switch */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
            <button
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              {mode === 'login' ? 'Hesap Oluştur' : 'Giriş Yap'}
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Demo:</strong> Herhangi bir email/şifre ile giriş yapabilirsiniz
          </p>
        </div>
      </div>
    </div>
  )
}