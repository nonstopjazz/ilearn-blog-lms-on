import { supabase } from './supabase'

// 用戶註冊
export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    // 1. 註冊用戶
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    if (authData.user) {
      // 2. 建立用戶 profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          role: 'student' // 預設為學生
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // 不拋出錯誤，因為主要註冊已成功
      }
    }

    return { user: authData.user, error: null }
  } catch (error: unknown) {
    return { user: null, error: error.message }
  }
}

// 用戶登入
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { user: data.user, error: null }
  } catch (error: unknown) {
    return { user: null, error: error.message }
  }
}

// 用戶登出
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: unknown) {
    return { error: error.message }
  }
}

// 取得當前用戶
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error: unknown) {
    return { user: null, error: error.message }
  }
}

// 取得用戶個人資料
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { profile: data, error: null }
  } catch (error: unknown) {
    return { profile: null, error: error.message }
  }
}