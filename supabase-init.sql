-- AI Affiliate Builder - Initialisation des tables
-- Exécutez ce script dans Supabase SQL Editor

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT,
    plan TEXT DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionEndsAt" TIMESTAMP(3),
    "sitesLimit" INTEGER DEFAULT 3,
    "sitesCreated" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Table des sites affiliés
CREATE TABLE IF NOT EXISTS "AffiliateSite" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    "productName" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    niche TEXT,
    headline TEXT,
    subheadline TEXT,
    description TEXT,
    features TEXT,
    benefits TEXT,
    pros TEXT,
    cons TEXT,
    faq TEXT,
    "callToAction" TEXT,
    "imageUrl" TEXT,
    "customImageUrl" TEXT,
    template TEXT DEFAULT 'modern',
    "primaryColor" TEXT DEFAULT '#6366f1',
    "accentColor" TEXT DEFAULT '#a855f7',
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT true,
    "customDomain" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Table des pages affiliées
CREATE TABLE IF NOT EXISTS "AffiliatePage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "siteId" TEXT NOT NULL REFERENCES "AffiliateSite"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("siteId", slug)
);

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    "displayName" TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    "priceYearly" DOUBLE PRECISION,
    currency TEXT DEFAULT 'EUR',
    "sitesLimit" INTEGER NOT NULL,
    "customDomains" BOOLEAN DEFAULT false,
    analytics BOOLEAN DEFAULT false,
    "removeBranding" BOOLEAN DEFAULT false,
    templates TEXT DEFAULT 'modern',
    priority INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les plans par défaut
INSERT INTO "SubscriptionPlan" (name, "displayName", price, "priceYearly", "sitesLimit", "customDomains", analytics, "removeBranding", templates, priority) VALUES
('free', 'Gratuit', 0, 0, 3, false, false, false, 'modern', 0),
('starter', 'Starter', 19, 190, 10, false, false, false, 'modern,classic,minimal,dark', 1),
('pro', 'Pro', 49, 490, -1, true, true, false, 'modern,classic,minimal,dark', 2),
('enterprise', 'Enterprise', 199, 1990, -1, true, true, true, 'modern,classic,minimal,dark', 3)
ON CONFLICT (name) DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "AffiliateSite_userId_idx" ON "AffiliateSite"("userId");
CREATE INDEX IF NOT EXISTS "AffiliateSite_slug_idx" ON "AffiliateSite"(slug);
CREATE INDEX IF NOT EXISTS "AffiliatePage_siteId_idx" ON "AffiliatePage"("siteId");

-- Trigger pour updatedAt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_affiliatesite_updated_at
    BEFORE UPDATE ON "AffiliateSite"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_affiliatepage_updated_at
    BEFORE UPDATE ON "AffiliatePage"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptionplan_updated_at
    BEFORE UPDATE ON "SubscriptionPlan"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
