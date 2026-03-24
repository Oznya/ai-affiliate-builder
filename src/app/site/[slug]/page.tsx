export const runtime = 'edge';
import { db } from '@/lib/db-edge';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  ArrowRight, 
  Zap,
  Shield,
  Clock,
  ThumbsUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SitePageProps {
  params: Promise<{ slug: string }>;
}

// Modern Template (Default)
function ModernTemplate({ site, features, benefits, pros, cons, faq }: { 
  site: any; 
  features: string[]; 
  benefits: string[]; 
  pros: string[]; 
  cons: string[]; 
  faq: { question: string; answer: string }[] 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-indigo-500/20 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span>AI Affiliate</span>
          </Link>
          <Badge className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Généré par IA
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {site.niche && (
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  {site.niche}
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {site.headline}
              </h1>
              <p className="text-xl text-indigo-200/80">
                {site.subheadline}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600 text-white text-lg px-8 py-6 shadow-lg shadow-indigo-500/30"
                  asChild
                >
                  <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
                    {site.callToAction}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-indigo-300/60">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <span>Achat sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>Livraison rapide</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-indigo-400" />
                  <span>Garantie</span>
                </div>
              </div>
            </div>
            <div className="relative">
              {site.customImageUrl || site.imageUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-indigo-500/20">
                  <img 
                    src={site.customImageUrl || `data:image/png;base64,${site.imageUrl}`}
                    alt={site.productName}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center shadow-2xl border border-indigo-500/20">
                  <div className="text-center p-8">
                    <Zap className="h-20 w-20 text-indigo-400 mx-auto mb-4" />
                    <p className="text-indigo-300/60">{site.productName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-slate-900/50 border-indigo-500/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                À propos de {site.productName}
              </h2>
              <p className="text-lg text-indigo-100/80 leading-relaxed">
                {site.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-indigo-500/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Fonctionnalités Principales
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-900/50 border-indigo-500/20 hover:border-indigo-400/40 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-indigo-100">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Pourquoi Choisir Ce Produit
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 bg-gradient-to-r from-indigo-500/10 to-transparent p-6 rounded-xl border border-indigo-500/10">
                <Star className="h-6 w-6 text-amber-400 flex-shrink-0" />
                <p className="text-lg text-indigo-100">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pros & Cons */}
      <section className="py-16 px-4 bg-indigo-500/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Avantages & Inconvénients
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-900/50 border-green-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Avantages
                </h3>
                <ul className="space-y-4">
                  {pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-3 text-indigo-100/80">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-amber-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Points d&apos;attention
                </h3>
                <ul className="space-y-4">
                  {cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-3 text-indigo-100/80">
                      <XCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Questions Fréquentes
          </h2>
          <div className="space-y-4">
            {faq.map((item, index) => (
              <Card key={index} className="bg-slate-900/50 border-indigo-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.question}
                  </h3>
                  <p className="text-indigo-200/70">
                    {item.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-violet-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à transformer votre vie?
          </h2>
          <p className="text-xl text-indigo-200/80 mb-8">
            Rejoignez des milliers de clients satisfaits
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600 text-white text-xl px-12 py-8 shadow-lg shadow-indigo-500/30"
            asChild
          >
            <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
              {site.callToAction}
              <ArrowRight className="ml-2 h-6 w-6" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-indigo-500/20">
        <div className="max-w-6xl mx-auto text-center text-indigo-300/40 text-sm">
          <p>Site généré automatiquement par AI Affiliate Builder</p>
          <p className="mt-2">
            <Link href="/" className="text-indigo-400 hover:underline">
              Créer votre propre site affilié
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Classic Template
function ClassicTemplate({ site, features, benefits, pros, cons, faq }: { 
  site: any; 
  features: string[]; 
  benefits: string[]; 
  pros: string[]; 
  cons: string[]; 
  faq: { question: string; answer: string }[] 
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span>Review Pro</span>
          </Link>
          <Badge className="bg-indigo-100 text-indigo-700">
            Revue Expert
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{site.headline}</h1>
              <p className="text-xl text-gray-600 mb-8">{site.subheadline}</p>
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
                  {site.callToAction}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-xl">
              {site.customImageUrl || site.imageUrl ? (
                <img src={site.customImageUrl || `data:image/png;base64,${site.imageUrl}`} alt={site.productName} className="w-full" />
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <Zap className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900">Présentation</h2>
            <p className="text-gray-600">{site.description}</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-12">Caractéristiques</h2>
            <ul className="space-y-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-green-800 mb-4">Points forts</h3>
                <ul className="space-y-2">
                  {pros.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-4">À considérer</h3>
                <ul className="space-y-2">
                  {cons.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-amber-700">
                      <XCircle className="h-4 w-4" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-12">FAQ</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i} className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900">{item.question}</h3>
                  <p className="text-gray-600 mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Obtenez le vôtre aujourd&apos;hui</h2>
          <Button size="lg" variant="secondary" asChild>
            <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
              {site.callToAction}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Minimal Template
function MinimalTemplate({ site, features, benefits, pros, cons, faq }: { 
  site: any; 
  features: string[]; 
  benefits: string[]; 
  pros: string[]; 
  cons: string[]; 
  faq: { question: string; answer: string }[] 
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-sm text-gray-500 hover:text-white">← Retour</Link>
        
        <h1 className="text-5xl font-bold mt-12 mb-6">{site.headline}</h1>
        <p className="text-xl text-gray-400 mb-12">{site.subheadline}</p>
        
        <div className="aspect-video bg-gray-900 rounded-lg mb-12 overflow-hidden">
          {site.customImageUrl || site.imageUrl ? (
            <img src={site.customImageUrl || `data:image/png;base64,${site.imageUrl}`} alt={site.productName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="h-16 w-16 text-gray-700" />
            </div>
          )}
        </div>
        
        <p className="text-lg text-gray-300 mb-12 leading-relaxed">{site.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-12">
          {features.slice(0, 4).map((f, i) => (
            <div key={i} className="p-4 border border-gray-800 rounded-lg">
              <span className="text-gray-400">{f}</span>
            </div>
          ))}
        </div>
        
        <Button size="lg" className="w-full bg-white text-black hover:bg-gray-200" asChild>
          <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
            {site.callToAction}
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// Dark Pro Template
function DarkProTemplate({ site, features, benefits, pros, cons, faq }: { 
  site: any; 
  features: string[]; 
  benefits: string[]; 
  pros: string[]; 
  cons: string[]; 
  faq: { question: string; answer: string }[] 
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">⚡ Affiliate Pro</Link>
            <Badge className="bg-white/10 text-white border-white/20">Premium</Badge>
          </div>
        </header>

        {/* Hero */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                {site.niche && (
                  <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-0">{site.niche}</Badge>
                )}
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {site.headline}
                </h1>
                <p className="text-xl text-gray-400 mb-8">{site.subheadline}</p>
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8" asChild>
                  <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
                    {site.callToAction}
                  </a>
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-30" />
                <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  {site.customImageUrl || site.imageUrl ? (
                    <img src={site.customImageUrl || `data:image/png;base64,${site.imageUrl}`} alt={site.productName} className="w-full" />
                  ) : (
                    <div className="aspect-square flex items-center justify-center">
                      <Zap className="h-24 w-24 text-white/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Caractéristiques</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/50 transition">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className="text-gray-300">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Commencez maintenant</h2>
            <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-12" asChild>
              <a href={site.affiliateUrl} target="_blank" rel="noopener noreferrer">
                {site.callToAction}
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function SitePage({ params }: SitePageProps) {
  const { slug } = await params;
  
  const site = await db.getSiteBySlug(slug);
  
  if (!site) {
    notFound();
  }
  
  // Parse JSON fields
  const features = site.features ? JSON.parse(site.features) : [];
  const benefits = site.benefits ? JSON.parse(site.benefits) : [];
  const pros = site.pros ? JSON.parse(site.pros) : [];
  const cons = site.cons ? JSON.parse(site.cons) : [];
  const faq = site.faq ? JSON.parse(site.faq) : [];
  
  const templateProps = { site, features, benefits, pros, cons, faq };
  
  // Render based on template
  switch (site.template) {
    case 'classic':
      return <ClassicTemplate {...templateProps} />;
    case 'minimal':
      return <MinimalTemplate {...templateProps} />;
    case 'dark':
      return <DarkProTemplate {...templateProps} />;
    default:
      return <ModernTemplate {...templateProps} />;
  }
}
