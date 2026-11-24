import { CekProgresView } from '@/components/public/CekProgresView';

interface CekKodePageProps {
  params: Promise<{ code: string }>;
}

export default async function CekKodePage({ params }: CekKodePageProps) {
  const { code } = await params;
  return <CekProgresView prefillCode={code} />;
}
