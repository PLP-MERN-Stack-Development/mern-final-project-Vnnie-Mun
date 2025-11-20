import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, MessageSquare, Database, Brain, CheckCircle, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <Leaf className="w-20 h-20 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          AI Crop Doctor
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Instant crop disease diagnosis via WhatsApp for Kenyan smallholder farmers.
          Send a photo, get expert advice in Swahili and English.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" className="gradient-primary">
            <MessageSquare className="mr-2 w-5 h-5" />
            Connect to WhatsApp
          </Button>
          <Button size="lg" variant="secondary">
            View Admin Dashboard
          </Button>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 shadow-custom-md">
            <MessageSquare className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3">1. Send Photo</h3>
            <p className="text-muted-foreground">
              Farmers send a photo of their sick crop to our WhatsApp number. Simple, fast, no app needed.
            </p>
          </Card>
          <Card className="p-6 shadow-custom-md">
            <Brain className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3">2. AI Analysis</h3>
            <p className="text-muted-foreground">
              Our ML model identifies the disease with confidence scores and severity estimates in seconds.
            </p>
          </Card>
          <Card className="p-6 shadow-custom-md">
            <CheckCircle className="w-12 h-12 text-success mb-4" />
            <h3 className="text-xl font-semibold mb-3">3. Get Advice</h3>
            <p className="text-muted-foreground">
              Receive diagnosis and treatment recommendations in both Swahili and English via WhatsApp.
            </p>
          </Card>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Production-Ready Architecture</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6">
            <Database className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2">Complete Backend</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Node.js + TypeScript API</li>
              <li>• PostgreSQL database with RLS</li>
              <li>• Redis job queue with BullMQ</li>
              <li>• S3-compatible storage (MinIO)</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Brain className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2">ML Inference Service</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Python FastAPI service</li>
              <li>• PlantVillage pre-trained model</li>
              <li>• MobileNetV3 architecture</li>
              <li>• 10+ disease classifications</li>
            </ul>
          </Card>
          <Card className="p-6">
            <MessageSquare className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2">WhatsApp Integration</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• WhatsApp Cloud API webhooks</li>
              <li>• Bilingual messaging (EN/SW)</li>
              <li>• Privacy-first (hashed IDs)</li>
              <li>• Mock mode for testing</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Shield className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2">Security & Privacy</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• JWT authentication</li>
              <li>• Hashed farmer identifiers</li>
              <li>• Input validation & sanitization</li>
              <li>• Audit logging</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="p-12 max-w-3xl mx-auto gradient-primary text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to Deploy</h2>
          <p className="text-lg mb-6 opacity-90">
            Complete Docker Compose setup with all services. Run locally in minutes or deploy to production.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary">
              View Documentation
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
              GitHub Repository
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t mt-16 py-8 text-center text-muted-foreground">
        <p>Built with ❤️ for Kenyan farmers • MIT License</p>
      </footer>
    </div>
  );
};

export default Index;