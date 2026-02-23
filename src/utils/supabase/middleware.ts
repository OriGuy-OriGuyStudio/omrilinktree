import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/admin/login')
  const isAdminRoute = pathname.startsWith('/admin')
  const isRootPath = pathname === '/'

  // If user is not logged in and trying to access admin or root, redirect to login
  if (!user && !isAuthRoute && (isAdminRoute || isRootPath)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    
    // Create the redirect response
    const response = NextResponse.redirect(url)
    
    // IMPORTANT: Propagate the cookies from the supabaseResponse to the redirect response
    // This ensures we don't lose the refreshed session if getUser() triggered a refresh
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  // If user is logged in and trying to access login, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  return supabaseResponse
}
