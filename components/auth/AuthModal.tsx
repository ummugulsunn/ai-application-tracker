"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations"
import { useAuthStore } from "@/store/authStore"
import { hasDataToMigrate } from "@/lib/dataMigration"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { DataMigrationModal } from "./DataMigrationModal"
import { 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  User, 
  Mail, 
  Lock,
  ArrowLeft,
  CheckCircle
} from "lucide-react"
import toast from "react-hot-toast"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null)
  const [rememberMe, setRememberMe] = useState(false)
  
  const router = useRouter()
  const { login, switchToRegistered, hasGuestData } = useAuthStore()
  
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  if (!isOpen) return null

  const handleLogin = async (data: LoginInput) => {
    setIsLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        // Fetch user profile
        const profileResponse = await fetch('/api/auth/profile')
        if (profileResponse.ok) {
          const { data: profile } = await profileResponse.json()
          
          const user = {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: `${profile.firstName} ${profile.lastName}`
          }
          
          // Check if we need to migrate guest data
          if (hasGuestData && hasDataToMigrate()) {
            setAuthenticatedUser({ user, profile })
            setShowMigrationModal(true)
          } else {
            // No migration needed, complete login
            login(user, profile, rememberMe)
            toast.success("Logged in successfully!")
            onClose()
            router.refresh()
          }
        } else {
          toast.error("Failed to load user profile")
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (data: RegisterInput) => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        // Auto-login after registration
        const loginResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (!loginResult?.error) {
          // Fetch user profile
          const profileResponse = await fetch('/api/auth/profile')
          if (profileResponse.ok) {
            const { data: profile } = await profileResponse.json()
            
            const user = {
              id: profile.id,
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
              name: `${profile.firstName} ${profile.lastName}`
            }
            
            // Check if we need to migrate guest data
            if (hasGuestData && hasDataToMigrate()) {
              setAuthenticatedUser({ user, profile })
              setShowMigrationModal(true)
            } else {
              // No migration needed, complete registration
              login(user, profile, rememberMe)
              toast.success("Account created and logged in successfully!")
              onClose()
              router.refresh()
            }
          }
        } else {
          toast.success("Account created! Please sign in.")
          setMode('login')
        }
      } else {
        toast.error(result.error?.message || "Registration failed")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMigrationComplete = (migrationResult: any) => {
    if (authenticatedUser) {
      switchToRegistered(authenticatedUser.user, authenticatedUser.profile)
      setShowMigrationModal(false)
      toast.success("Welcome! Your data has been migrated successfully.")
      onClose()
      router.refresh()
    }
  }

  const handleSkipMigration = () => {
    if (authenticatedUser) {
      login(authenticatedUser.user, authenticatedUser.profile, rememberMe)
      setShowMigrationModal(false)
      toast.success("Welcome to your new account!")
      onClose()
      router.refresh()
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <Card className="w-full max-w-md">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Guest Data Notice */}
            {hasGuestData && hasDataToMigrate() && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    Your guest data will be preserved
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  After signing in, we'll help you migrate your existing applications.
                </p>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      {...loginForm.register("email")}
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      error={loginForm.formState.errors.email?.message}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      {...loginForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      error={loginForm.formState.errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Don't have an account? Create one
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...registerForm.register("firstName")}
                        type="text"
                        placeholder="First name"
                        className="pl-10"
                        error={registerForm.formState.errors.firstName?.message}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      {...registerForm.register("lastName")}
                      type="text"
                      placeholder="Last name"
                      error={registerForm.formState.errors.lastName?.message}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      {...registerForm.register("email")}
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      error={registerForm.formState.errors.email?.message}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      {...registerForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
                      error={registerForm.formState.errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <Input
                    {...registerForm.register("phone")}
                    type="tel"
                    placeholder="Enter your phone number"
                    error={registerForm.formState.errors.phone?.message}
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Optional)
                  </label>
                  <Input
                    {...registerForm.register("location")}
                    type="text"
                    placeholder="Enter your location"
                    error={registerForm.formState.errors.location?.message}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Keep me signed in</span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-xs text-gray-500 text-center">
              <p>
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Your data is encrypted and secure.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Migration Modal */}
      {showMigrationModal && authenticatedUser && (
        <DataMigrationModal
          isOpen={showMigrationModal}
          onClose={handleSkipMigration}
          user={authenticatedUser.user}
          onMigrationComplete={handleMigrationComplete}
        />
      )}
    </>
  )
}