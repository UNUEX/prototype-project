import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LANGS = ['ru', 'kz', 'en'];
const DEFAULT_LANG = 'ru';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем: статику, API, Next.js internals, публичные файлы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    /\.(.+)$/.test(pathname)  // любые файлы с расширением (.ico, .png, .svg...)
  ) {
    return NextResponse.next();
  }

  // Проверяем первый сегмент пути — язык ли это
  const firstSegment = pathname.split('/')[1];
  const hasLang = SUPPORTED_LANGS.includes(firstSegment);

  if (!hasLang) {
    // Нет языка — редиректим. Читаем предпочтение из cookie
    const cookieLang = request.cookies.get('NEXT_LOCALE')?.value;
    const lang = cookieLang && SUPPORTED_LANGS.includes(cookieLang) ? cookieLang : DEFAULT_LANG;

    const newUrl = new URL(`/${lang}${pathname}`, request.url);
    // Сохраняем query params
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // Есть язык — сохраняем в cookie и пропускаем
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', firstSegment, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 год
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  // Обрабатываем всё кроме статики Next.js и файлов с расширением
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};