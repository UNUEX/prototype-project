/**
 * app/[lang]/api/parse-syllabus/route.ts
 *
 * Next.js App Router API route — проксирует запрос на Express-сервер.
 */

import { NextRequest, NextResponse } from 'next/server';

const EXPRESS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${EXPRESS_API}/parse-syllabus`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: Record<string, string>;
      try {
        errorJson = JSON.parse(errorText) as Record<string, string>;
      } catch {
        errorJson = { error: errorText };
      }
      return NextResponse.json(errorJson, { status: response.status });
    }

    const data: unknown = await response.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ parse-syllabus proxy error:', message);
    return NextResponse.json(
      { error: 'Ошибка загрузки файла', message },
      { status: 500 }
    );
  }
}