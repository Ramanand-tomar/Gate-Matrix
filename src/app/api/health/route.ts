import { NextResponse } from 'next/server';

export async function GET() {
  const env = process.env.NODE_ENV || 'development';
  const targetProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566';

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env,
    targetProject: targetProject,
    version: '1.0.0'
  });
}
