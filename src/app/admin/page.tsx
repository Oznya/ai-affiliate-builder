'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, 
  Link as LinkIcon, 
  Tag, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Loader2,
  Globe,
  Rocket,
  CheckCircle,
  Copy,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Site {
  id: string
  name: string
  slug: string
  headline: string
  subheadline: string
  description: string
  features: string
  benefits: string
  pros: string
  cons: string
  faq: string
  callToAction: string
  createdAt: string
  niche: string | null
  template: string
  imageUrl: string | null
  customImageUrl: string | null
  productUrl: string
  affiliateUrl: string
  productName: string
}

const TEMPLATES = [
  { id: 'modern', name: 'Moderne', description: 'Design épuré avec gradients', icon: '✨' },
  { id: 'classic', name: 'Classique', description: 'Style professionnel traditionnel', icon: '👔' },
  { id: 'minimal', name: 'Minimal', description: 'Simple et efficace', icon: '◻️' },
  { id: 'dark', name: 'Dark Pro', description: 'Ambiance sombre premium', icon: '🌙' },
]

export default function AdminPage() {
  const [productUrl, setProductUrl] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [niche, setNiche] = useState('')
  const [customName, setCustomName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [isGenerating, setIsGenerating] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    headline: '',
    subheadline: '',
    description: '',
    features: '',
    benefits: '',
    pros: '',
    cons: '',
    faq: '',
    callToAction: '',
    niche: '',
    template: 'modern',
    customImageUrl: '',
    affiliateUrl: ''
  })

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

  const handleGenerate = async () => {
    if (!productUrl) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une URL de produit',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl,
          affiliateUrl: affiliateUrl || productUrl,
          niche: niche || undefined,
          customName: customName || undefined,
          template: selectedTemplate
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Site généré avec succès!',
          description: 'Votre page affiliée est prête.',
        })
        setProductUrl('')
        setAffiliateUrl('')
        setNiche('')
        setCustomName('')
        fetchSites()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer le site. Veuillez réessayer.',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce site?')) return
    
    try {
      await fetch(`/api/sites?id=${id}`, { method: 'DELETE' })
      setSites(sites.filter(s => s.id !== id))
      toast({
        title: 'Site supprimé',
        description: 'Le site a été supprimé avec succès.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le site.',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (site: Site) => {
    setEditingSite(site)
    setEditForm({
      name: site.name || '',
      headline: site.headline || '',
      subheadline: site.subheadline || '',
      description: site.description || '',
      features: site.features || '',
      benefits: site.benefits || '',
      pros: site.pros || '',
      cons: site.cons || '',
      faq: site.faq || '',
      callToAction: site.callToAction || '',
      niche: site.niche || '',
      template: site.template || 'modern',
      customImageUrl: site.customImageUrl || '',
      affiliateUrl: site.affiliateUrl || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingSite) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/sites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSite.id,
          ...editForm
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Site mis à jour!',
          description: 'Les modifications ont été sauvegardées.',
        })
        setEditingSite(null)
        fetchSites()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder les modifications.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/site/${slug}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'URL copiée!',
      description: 'L\'URL a été copiée dans le presse-papiers.',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 w-full flex flex-col items-center">
      {/* Header */}
      <header className="w-full border-b border-indigo-500/20 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin - AI Affiliate Builder</h1>
              <p className="text-xs text-indigo-300">Créez et gérez les sites de vos clients</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Panel Admin
            </Badge>
            <a href="/">
              <Button variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voir le site public
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{sites.length}</p>
                  <p className="text-xs text-indigo-300">Sites créés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{new Set(sites.map(s => s.niche).filter(Boolean)).size}</p>
                  <p className="text-xs text-indigo-300">Niches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-xs text-indigo-300">Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-indigo-300">IA Généré</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Site */}
        <Card className="bg-slate-900/50 border-indigo-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Rocket className="h-5 w-5 text-indigo-400" />
              Créer un nouveau site pour un client
            </CardTitle>
            <CardDescription className="text-indigo-200/60">
              Entrez l'URL du produit et l'IA générera une page affiliée optimisée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productUrl" className="text-indigo-100">URL du produit *</Label>
                <Input
                  id="productUrl"
                  type="url"
                  placeholder="https://amazon.com/product/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="bg-slate-800 border-indigo-500/30 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliateUrl" className="text-indigo-100">URL affiliée (optionnel)</Label>
                <Input
                  id="affiliateUrl"
                  type="url"
                  placeholder="https://affiliatenetwork.com/track/..."
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  className="bg-slate-800 border-indigo-500/30 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customName" className="text-indigo-100">Nom du produit (optionnel)</Label>
                <Input
                  id="customName"
                  type="text"
                  placeholder="Nom personnalisé"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-slate-800 border-indigo-500/30 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche" className="text-indigo-100">Niche (optionnel)</Label>
                <Input
                  id="niche"
                  type="text"
                  placeholder="Santé, Fitness, Technologie..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-slate-800 border-indigo-500/30 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label className="text-indigo-100">Template</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-500/20'
                        : 'border-indigo-500/20 bg-slate-800/50 hover:border-indigo-400/50'
                    }`}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <p className="text-white font-medium text-sm mt-1">{template.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !productUrl}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600 text-white py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Générer le site
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sites List */}
        <Card className="bg-slate-900/50 border-indigo-500/20">
          <CardHeader>
            <CardTitle className="text-white">Sites de vos clients ({sites.length})</CardTitle>
            <CardDescription className="text-indigo-200/60">
              Cliquez sur "Modifier" pour éditer le contenu d'un site
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <p className="text-indigo-200">Aucun site créé pour le moment</p>
                <p className="text-indigo-300/50 text-sm mt-2">Créez votre premier site ci-dessus!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-indigo-500/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{site.name}</h3>
                        {site.niche && (
                          <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-xs">
                            {site.niche}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                          {site.template}
                        </Badge>
                      </div>
                      <p className="text-indigo-200/60 text-sm truncate">{site.headline}</p>
                      <p className="text-indigo-300/40 text-xs mt-1">
                        Créé le {new Date(site.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                        asChild
                      >
                        <a href={`/site/${site.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                        onClick={() => copyToClipboard(site.slug)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                        onClick={() => handleEdit(site)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDelete(site.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Modal */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <Card className="bg-slate-900 border-indigo-500/30 max-w-4xl w-full my-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-indigo-400" />
                  Modifier le site
                </CardTitle>
                <CardDescription className="text-indigo-200/60">
                  {editingSite.name} - /site/{editingSite.slug}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingSite(null)}>
                <X className="h-5 w-5 text-indigo-300" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-indigo-100">Nom du produit</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-slate-800 border-indigo-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-100">Niche</Label>
                  <Input
                    value={editForm.niche}
                    onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                    className="bg-slate-800 border-indigo-500/30 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">Titre principal (Headline)</Label>
                <Input
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  className="bg-slate-800 border-indigo-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">Sous-titre (Subheadline)</Label>
                <Input
                  value={editForm.subheadline}
                  onChange={(e) => setEditForm({ ...editForm, subheadline: e.target.value })}
                  className="bg-slate-800 border-indigo-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="bg-slate-800 border-indigo-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">Fonctionnalités (JSON array)</Label>
                <Textarea
                  value={editForm.features}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                  rows={3}
                  placeholder='["Feature 1", "Feature 2"]'
                  className="bg-slate-800 border-indigo-500/30 text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">Bénéfices (JSON array)</Label>
                <Textarea
                  value={editForm.benefits}
                  onChange={(e) => setEditForm({ ...editForm, benefits: e.target.value })}
                  rows={3}
                  placeholder='["Bénéfice 1", "Bénéfice 2"]'
                  className="bg-slate-800 border-indigo-500/30 text-white font-mono text-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-indigo-100">Points positifs (JSON array)</Label>
                  <Textarea
                    value={editForm.pros}
                    onChange={(e) => setEditForm({ ...editForm, pros: e.target.value })}
                    rows={3}
                    placeholder='["Pro 1", "Pro 2"]'
                    className="bg-slate-800 border-indigo-500/30 text-white font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-100">Points négatifs (JSON array)</Label>
                  <Textarea
                    value={editForm.cons}
                    onChange={(e) => setEditForm({ ...editForm, cons: e.target.value })}
                    rows={3}
                    placeholder='["Con 1", "Con 2"]'
                    className="bg-slate-800 border-indigo-500/30 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">FAQ (JSON array)</Label>
                <Textarea
                  value={editForm.faq}
                  onChange={(e) => setEditForm({ ...editForm, faq: e.target.value })}
                  rows={4}
                  placeholder='[{"question": "Q1?", "answer": "R1"}]'
                  className="bg-slate-800 border-indigo-500/30 text-white font-mono text-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-indigo-100">Appel à l'action</Label>
                  <Input
                    value={editForm.callToAction}
                    onChange={(e) => setEditForm({ ...editForm, callToAction: e.target.value })}
                    className="bg-slate-800 border-indigo-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-100">Template</Label>
                  <select
                    value={editForm.template}
                    onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border border-indigo-500/30 text-white"
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">URL de l'image personnalisée</Label>
                <Input
                  value={editForm.customImageUrl}
                  onChange={(e) => setEditForm({ ...editForm, customImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800 border-indigo-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-100">URL affiliée</Label>
                <Input
                  value={editForm.affiliateUrl}
                  onChange={(e) => setEditForm({ ...editForm, affiliateUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800 border-indigo-500/30 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-indigo-500/30 text-indigo-300"
                  onClick={() => setEditingSite(null)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
