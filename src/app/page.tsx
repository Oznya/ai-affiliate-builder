'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import StarryBackground from '@/components/StarryBackground'
import { 
  Zap, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Globe,
  Rocket,
  CheckCircle,
  Settings
} from 'lucide-react'

interface Site {
  id: string
  name: string
  slug: string
  headline: string
  niche: string | null
  template: string
  createdAt: string
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      const data = await response.json()
      setSites(data.sites || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center w-full">
      {/* Animated Starry Background */}
      <StarryBackground />

      {/* Header */}
      <header className="w-full border-b border-indigo-500/20 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Affiliate Builder</h1>
              <p className="text-xs text-indigo-300">Générateur de sites affiliés</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            <a href="/admin">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative w-full">
        <div className="max-w-4xl w-full mx-auto text-center">
          {/* Hero */}
          <Badge className="mb-6 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30">
            Nouveau
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Générez des sites affiliés en{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              60 secondes
            </span>
          </h2>
          <p className="text-xl text-indigo-200/80 max-w-2xl mx-auto mb-8">
            Créez des pages de review optimisées pour vos produits affiliés grâce à l'intelligence artificielle.
          </p>

          {/* CTA Button */}
          <a href="/admin">
            <Button size="lg" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600 text-white text-lg px-8 py-6 shadow-lg shadow-indigo-500/30">
              <Rocket className="mr-2 h-5 w-5" />
              Accéder au Panel Admin
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-12">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{sites.length}</p>
              <p className="text-sm text-indigo-300 mt-1">Sites créés</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">4</p>
              <p className="text-sm text-indigo-300 mt-1">Templates</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">100%</p>
              <p className="text-sm text-indigo-300 mt-1">IA Généré</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl w-full mx-auto mt-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Comment ça fonctionne</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: '1. Entrez l\'URL', desc: 'Collez l\'URL de votre produit affilié', color: 'indigo' },
              { icon: Sparkles, title: '2. Génération IA', desc: 'L\'IA crée le contenu optimisé', color: 'purple' },
              { icon: CheckCircle, title: '3. Site prêt', desc: 'Votre page affiliée est en ligne', color: 'violet' }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-900/50 border-indigo-500/20 backdrop-blur-sm hover:border-indigo-400/50 transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 rounded-full bg-${feature.color}-500/20 flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`h-7 w-7 text-${feature.color}-400`} />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-indigo-200/60">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Sites */}
        {!isLoading && sites.length > 0 && (
          <div className="max-w-5xl w-full mx-auto mt-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Sites récents</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.slice(0, 6).map((site) => (
                <Card key={site.id} className="bg-slate-900/50 border-indigo-500/20 hover:border-indigo-400/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium truncate flex-1">{site.name}</h4>
                      {site.niche && (
                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-xs ml-2">
                          {site.niche}
                        </Badge>
                      )}
                    </div>
                    <p className="text-indigo-200/60 text-sm truncate mb-3">{site.headline}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                      asChild
                    >
                      <a href={`/site/${site.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le site
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-indigo-500/20 py-6 relative">
        <div className="max-w-6xl w-full mx-auto px-4 text-center">
          <p className="text-indigo-300/60">
            AI Affiliate Builder - Créez des sites affiliés optimisés en quelques secondes
          </p>
        </div>
      </footer>
    </div>
  )
}
