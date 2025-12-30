import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/exhibits', '/onboarding', '/billing']
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  // Redirect to signin if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/signin', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if user has an organization when accessing non-onboarding protected routes
  if (session && isProtectedPath && !req.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_user_id', session.user.id)
      .single()

    // Redirect to onboarding if no organization exists
    if (!org) {
      const redirectUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to exhibits if accessing auth routes with active session
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    // Check if user has an organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_user_id', session.user.id)
      .single()

    // Redirect to onboarding if no org, otherwise to exhibits
    const redirectUrl = new URL(org ? '/exhibits' : '/onboarding', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/exhibits/:path*',
    '/onboarding/:path*',
    '/billing/:path*',
    '/auth/:path*',
  ],
}
