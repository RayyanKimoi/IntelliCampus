'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/insights');
  }, [router]);
  return null;
}
