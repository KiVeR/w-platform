<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { Sonner } from '@/components/ui/sonner'
import {
  Send, MessageSquare, MousePointer, CreditCard, MapPin, Layout, BarChart3,
  Plus, Trash2, Pencil, MoreHorizontal, ChevronRight, Settings, Moon, Sun,
  TrendingUp, TrendingDown, Loader2, ArrowRight,
  CircleCheck, TriangleAlert, Info,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import type { CampaignStatus } from '@/components/shared/CampaignStatusBadge.vue'

const { isDark, setMode } = useColorMode()

function applyColorMode(value: boolean) {
  setMode(value ? 'dark' : 'light')
}

// Color palette data
const orangeScale = [
  { name: '50', class: 'bg-orange-50' },
  { name: '100', class: 'bg-orange-100' },
  { name: '200', class: 'bg-orange-200' },
  { name: '300', class: 'bg-orange-300' },
  { name: '400', class: 'bg-orange-400' },
  { name: '500', class: 'bg-orange-500' },
  { name: '600', class: 'bg-orange-600' },
  { name: '700', class: 'bg-orange-700' },
  { name: '800', class: 'bg-orange-800' },
  { name: '900', class: 'bg-orange-900' },
  { name: '950', class: 'bg-orange-950' },
]

const zincScale = [
  { name: '50', class: 'bg-zinc-50' },
  { name: '100', class: 'bg-zinc-100' },
  { name: '200', class: 'bg-zinc-200' },
  { name: '300', class: 'bg-zinc-300' },
  { name: '400', class: 'bg-zinc-400' },
  { name: '500', class: 'bg-zinc-500' },
  { name: '600', class: 'bg-zinc-600' },
  { name: '700', class: 'bg-zinc-700' },
  { name: '800', class: 'bg-zinc-800' },
  { name: '900', class: 'bg-zinc-900' },
  { name: '950', class: 'bg-zinc-950' },
]

const campaignStatuses: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed']

const skeletonVariant = ref<'cards' | 'table' | 'full'>('full')

// Form validation schema (4.11)
const formSchema = toTypedSchema(z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères').max(149, 'Le message ne peut pas dépasser 149 caractères'),
  type: z.enum(['prospection', 'fidelisation', 'comptage'], { required_error: 'Veuillez sélectionner un type' }),
}))

const { handleSubmit: onFormSubmit } = useForm({ validationSchema: formSchema })
const handleFormSubmit = onFormSubmit((values) => {
  toast.success(`Formulaire valide : ${values.name}`)
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Sonner provider for toasts -->
    <Sonner position="bottom-right" />

    <div class="mx-auto max-w-6xl px-6 py-12">
      <!-- ============================================================ -->
      <!-- 1. HEADER + DARK MODE TOGGLE -->
      <!-- ============================================================ -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Wellpack Design System</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Kitchen sink — validation visuelle des tokens, composants et patterns UX
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Sun class="size-4 text-muted-foreground" />
          <Switch :model-value="isDark" @update:model-value="applyColorMode" />
          <Moon class="size-4 text-muted-foreground" />
        </div>
      </div>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 2. COULEURS -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Couleurs</h2>
        <p class="mt-1 text-sm text-muted-foreground">Palette oklch — Tailwind v4 @theme tokens</p>

        <!-- Orange -->
        <h3 class="mt-6 text-lg font-medium">Primary — Orange</h3>
        <div class="mt-3 flex gap-1">
          <div v-for="c in orangeScale" :key="c.name" class="flex flex-col items-center gap-1">
            <div :class="[c.class, 'h-12 w-12 rounded-md border']" />
            <span class="text-xs text-muted-foreground">{{ c.name }}</span>
          </div>
        </div>

        <!-- Zinc -->
        <h3 class="mt-6 text-lg font-medium">Neutrals — Zinc</h3>
        <div class="mt-3 flex gap-1">
          <div v-for="c in zincScale" :key="c.name" class="flex flex-col items-center gap-1">
            <div :class="[c.class, 'h-12 w-12 rounded-md border']" />
            <span class="text-xs text-muted-foreground">{{ c.name }}</span>
          </div>
        </div>

        <!-- Semantic -->
        <h3 class="mt-6 text-lg font-medium">Sémantiques</h3>
        <div class="mt-3 grid grid-cols-4 gap-4">
          <div>
            <p class="mb-2 text-sm font-medium text-success-700">Success</p>
            <div class="flex gap-1">
              <div class="h-10 w-10 rounded-md border bg-success-50" />
              <div class="h-10 w-10 rounded-md border bg-success-100" />
              <div class="h-10 w-10 rounded-md bg-success-500" />
              <div class="h-10 w-10 rounded-md bg-success-600" />
              <div class="h-10 w-10 rounded-md bg-success-700" />
            </div>
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-warning-700">Warning</p>
            <div class="flex gap-1">
              <div class="h-10 w-10 rounded-md border bg-warning-50" />
              <div class="h-10 w-10 rounded-md border bg-warning-100" />
              <div class="h-10 w-10 rounded-md bg-warning-500" />
              <div class="h-10 w-10 rounded-md bg-warning-600" />
              <div class="h-10 w-10 rounded-md bg-warning-700" />
            </div>
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-error-700">Error</p>
            <div class="flex gap-1">
              <div class="h-10 w-10 rounded-md border bg-error-50" />
              <div class="h-10 w-10 rounded-md border bg-error-100" />
              <div class="h-10 w-10 rounded-md bg-error-500" />
              <div class="h-10 w-10 rounded-md bg-error-600" />
              <div class="h-10 w-10 rounded-md bg-error-700" />
            </div>
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-info-700">Info</p>
            <div class="flex gap-1">
              <div class="h-10 w-10 rounded-md border bg-info-50" />
              <div class="h-10 w-10 rounded-md border bg-info-100" />
              <div class="h-10 w-10 rounded-md bg-info-500" />
              <div class="h-10 w-10 rounded-md bg-info-600" />
              <div class="h-10 w-10 rounded-md bg-info-700" />
            </div>
          </div>
        </div>

        <!-- Chart colors -->
        <h3 class="mt-6 text-lg font-medium">Chart Colors</h3>
        <div class="mt-3 flex gap-2">
          <div class="flex flex-col items-center gap-1">
            <div class="h-10 w-10 rounded-md bg-chart-1" />
            <span class="text-xs text-muted-foreground">1</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="h-10 w-10 rounded-md bg-chart-2" />
            <span class="text-xs text-muted-foreground">2</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="h-10 w-10 rounded-md bg-chart-3" />
            <span class="text-xs text-muted-foreground">3</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="h-10 w-10 rounded-md bg-chart-4" />
            <span class="text-xs text-muted-foreground">4</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="h-10 w-10 rounded-md bg-chart-5" />
            <span class="text-xs text-muted-foreground">5</span>
          </div>
        </div>

        <!-- Campaign status badges -->
        <h3 class="mt-6 text-lg font-medium">Statuts Campagne</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <CampaignStatusBadge v-for="s in campaignStatuses" :key="s" :status="s" />
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 3. TYPOGRAPHIE -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Typographie</h2>
        <p class="mt-1 text-sm text-muted-foreground">Instrument Sans + JetBrains Mono — base 14px</p>

        <!-- Scale -->
        <div class="mt-6 space-y-3">
          <p class="text-3xl font-bold">text-3xl bold — Wellpack Dashboard (24px)</p>
          <p class="text-2xl font-semibold">text-2xl semibold — Titre de page (20px)</p>
          <p class="text-xl font-semibold">text-xl semibold — Titre de section (18px)</p>
          <p class="text-lg font-medium">text-lg medium — Sous-titre (16px)</p>
          <p class="text-base">text-base regular — Corps principal (14px)</p>
          <p class="text-sm">text-sm regular — Corps secondaire (13px)</p>
          <p class="text-xs text-muted-foreground">text-xs muted — Labels, metadata (12px)</p>
        </div>

        <!-- Font characteristics -->
        <h3 class="mt-6 text-lg font-medium">Instrument Sans — Caractéristiques</h3>
        <div class="mt-3 space-y-2 text-lg">
          <p>Lettre <strong>g</strong> distinctif (double-étage) : design, targeting, engaging</p>
          <p>Formes géométriques ouvertes : acquisition, analytics, dashboard</p>
          <p>Chiffres <strong>0 6 9</strong> bien différenciés : 0690 — 96 096 — 60 609</p>
        </div>

        <!-- Tabular nums -->
        <h3 class="mt-6 text-lg font-medium">Tabular Nums</h3>
        <div class="mt-3 grid grid-cols-2 gap-6">
          <div>
            <p class="mb-2 text-sm font-medium text-muted-foreground">Proportionnel (défaut)</p>
            <div class="space-y-1 text-lg">
              <p>1 111 111</p>
              <p>9 999 999</p>
              <p>4 204 867</p>
            </div>
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-muted-foreground">Tabular (tabular-nums)</p>
            <div class="space-y-1 text-lg tabular-nums">
              <p>1 111 111</p>
              <p>9 999 999</p>
              <p>4 204 867</p>
            </div>
          </div>
        </div>

        <!-- Mono font -->
        <h3 class="mt-6 text-lg font-medium">JetBrains Mono</h3>
        <p class="mt-2 font-mono text-sm">
          GET /api/campaigns/42/stats — 200 OK — 12ms
        </p>
        <p class="mt-1 font-mono text-xs text-muted-foreground">
          Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
        </p>

        <!-- Weights -->
        <h3 class="mt-6 text-lg font-medium">Poids</h3>
        <div class="mt-3 space-y-2 text-base">
          <p class="font-normal">400 normal — Corps de texte standard</p>
          <p class="font-medium">500 medium — Labels, sous-titres, headers table</p>
          <p class="font-semibold">600 semibold — Titres, badges, boutons</p>
          <p class="font-bold">700 bold — KPI values, headings hero</p>
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 4. BOUTONS -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Boutons</h2>

        <!-- Variants -->
        <h3 class="mt-6 text-lg font-medium">Variants</h3>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Confirmer l'envoi</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>

        <!-- Sizes -->
        <h3 class="mt-6 text-lg font-medium">Tailles</h3>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>

        <!-- Icon buttons -->
        <h3 class="mt-6 text-lg font-medium">Icon Buttons</h3>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button size="icon-sm" variant="outline"><Plus class="size-4" /></Button>
          <Button size="icon" variant="outline"><Pencil class="size-4" /></Button>
          <Button size="icon-lg" variant="outline"><Settings class="size-4" /></Button>
          <Button size="icon" variant="destructive"><Trash2 class="size-4" /></Button>
          <Button size="icon" variant="ghost"><MoreHorizontal class="size-4" /></Button>
        </div>

        <!-- States -->
        <h3 class="mt-6 text-lg font-medium">États</h3>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button disabled variant="outline">Disabled Outline</Button>
          <Button disabled>
            <Loader2 class="mr-2 size-4 animate-spin" />
            Chargement...
          </Button>
        </div>

        <!-- With icons -->
        <h3 class="mt-6 text-lg font-medium">Avec icônes</h3>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button><Plus class="mr-2 size-4" />Nouvelle campagne</Button>
          <Button variant="outline">Suivant <ArrowRight class="ml-2 size-4" /></Button>
          <Button variant="destructive"><Trash2 class="mr-2 size-4" />Supprimer</Button>
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 5. BADGES -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Badges</h2>

        <h3 class="mt-6 text-lg font-medium">Variants shadcn</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>

        <h3 class="mt-6 text-lg font-medium">Statuts campagne (CampaignStatusBadge)</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <CampaignStatusBadge v-for="s in campaignStatuses" :key="s" :status="s" />
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 6. CARDS -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Cards</h2>

        <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- KPI Cards preview -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Campagnes actives</CardTitle>
              <Send class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">3</div>
              <p class="flex items-center gap-1 text-xs text-success-600">
                <TrendingUp class="size-3" /> +1 ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">SMS envoyés</CardTitle>
              <MessageSquare class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">12 450</div>
              <p class="flex items-center gap-1 text-xs text-success-600">
                <TrendingUp class="size-3" /> +2 340
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Taux de clic LP</CardTitle>
              <MousePointer class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">4.2%</div>
              <p class="flex items-center gap-1 text-xs text-error-600">
                <TrendingDown class="size-3" /> -0.3%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Crédits SMS</CardTitle>
              <CreditCard class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">7 500</div>
              <Progress :model-value="75" class="mt-2" />
              <p class="mt-1 text-xs text-muted-foreground">75% restant</p>
            </CardContent>
          </Card>
        </div>

        <!-- Standard card -->
        <Card class="mt-6 max-w-md">
          <CardHeader>
            <CardTitle>Card standard</CardTitle>
            <CardDescription>Card avec header, content et footer</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm">Contenu de la card. Utilise les variables sémantiques --card et --card-foreground.</p>
          </CardContent>
          <CardFooter class="gap-2">
            <Button variant="outline" size="sm">Annuler</Button>
            <Button size="sm">Sauvegarder</Button>
          </CardFooter>
        </Card>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 7. FORMULAIRES -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Formulaires</h2>

        <div class="mt-6 grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Input -->
          <div class="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="jean@wellpack.fr" />
          </div>

          <!-- Input error -->
          <div class="space-y-2">
            <Label>Email (erreur)</Label>
            <Input type="email" model-value="invalide@" class="border-error-500 focus-visible:ring-error-500" />
            <p class="text-sm text-error-600">L'adresse email n'est pas valide</p>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <Label>Mot de passe</Label>
            <Input type="password" placeholder="••••••••" />
          </div>

          <!-- Disabled -->
          <div class="space-y-2">
            <Label>Désactivé</Label>
            <Input disabled model-value="Non modifiable" />
          </div>

          <!-- Textarea -->
          <div class="col-span-full space-y-2">
            <Label>Message SMS</Label>
            <Textarea placeholder="Bonjour ${prenom}, profitez de notre offre..." :rows="3" />
            <p class="text-xs text-muted-foreground">0 / 149 caractères — 1 SMS</p>
          </div>

          <!-- Select -->
          <div class="space-y-2">
            <Label>Type de campagne</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospection">Prospection</SelectItem>
                <SelectItem value="fidelisation">Fidélisation</SelectItem>
                <SelectItem value="comptage">Comptage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Checkbox + Switch -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label for="terms" class="text-sm">J'accepte les conditions générales</Label>
            </div>
            <div class="flex items-center gap-2">
              <Switch id="notif" />
              <Label for="notif" class="text-sm">Notifications email</Label>
            </div>
          </div>
        </div>

        <!-- Form Validation (vee-validate + zod) -->
        <h3 class="mt-6 text-lg font-medium">Form Validation (vee-validate + zod)</h3>
        <form class="mt-3 max-w-md space-y-4" @submit="handleFormSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nom de la campagne</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Promo été 2026" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="message">
            <FormItem>
              <FormLabel>Message SMS</FormLabel>
              <FormControl>
                <Textarea placeholder="Bonjour, profitez de notre offre..." :rows="3" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="type">
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prospection">Prospection</SelectItem>
                  <SelectItem value="fidelisation">Fidélisation</SelectItem>
                  <SelectItem value="comptage">Comptage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit">Valider</Button>
        </form>

        <!-- Progress -->
        <h3 class="mt-6 text-lg font-medium">Progress (Credit Gauge)</h3>
        <div class="mt-3 max-w-sm space-y-3">
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>Crédits SMS</span>
              <span class="font-medium tabular-nums">75%</span>
            </div>
            <Progress :model-value="75" />
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>Crédits faibles</span>
              <span class="font-medium tabular-nums">15%</span>
            </div>
            <Progress :model-value="15" color="warning" />
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>Crédits épuisés</span>
              <span class="font-medium tabular-nums">0%</span>
            </div>
            <Progress :model-value="0" color="error" />
          </div>
        </div>

        <!-- Avatar -->
        <h3 class="mt-6 text-lg font-medium">Avatars</h3>
        <div class="mt-3 flex items-center gap-3">
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>WP</AvatarFallback>
          </Avatar>
          <Avatar class="size-12">
            <AvatarFallback class="text-lg">AB</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 8. FEEDBACK -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Feedback</h2>

        <!-- Alerts -->
        <h3 class="mt-6 text-lg font-medium">Alerts</h3>
        <div class="mt-3 max-w-lg space-y-3">
          <Alert>
            <AlertTitle>Default</AlertTitle>
            <AlertDescription>Alert neutre pour les informations contextuelles.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <Info class="size-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>Les statistiques seront disponibles 72h après l'envoi.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheck class="size-4" />
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>La campagne a été envoyée avec succès à 12 450 destinataires.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlert class="size-4" />
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>Vos crédits SMS sont faibles. Pensez à recharger.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de sauvegarder la campagne. Veuillez réessayer.</AlertDescription>
          </Alert>
        </div>

        <!-- Toasts -->
        <h3 class="mt-6 text-lg font-medium">Toasts (Sonner)</h3>
        <div class="mt-3 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            @click="toast.success('Campagne créée avec succès')"
          >
            Success
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="toast.error('Erreur lors de la sauvegarde')"
          >
            Error
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="toast.warning('Crédits SMS faibles')"
          >
            Warning
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="toast.info('Brouillon sauvegardé')"
          >
            Info
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="toast.loading('Envoi en cours...')"
          >
            Loading
          </Button>
        </div>

        <!-- AlertDialog -->
        <h3 class="mt-6 text-lg font-medium">AlertDialog (confirmation destructrice)</h3>
        <div class="mt-3">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm">
                <Trash2 class="mr-2 size-4" />
                Supprimer la campagne
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La campagne "Promo été" et toutes ses données seront supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 9. DATA DISPLAY -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Data Display</h2>

        <!-- Table -->
        <h3 class="mt-6 text-lg font-medium">Table</h3>
        <div class="mt-3 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead class="text-right tabular-nums">Volume</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">Promo été 2026</TableCell>
                <TableCell>Prospection</TableCell>
                <TableCell><CampaignStatusBadge status="sent" /></TableCell>
                <TableCell class="text-right tabular-nums">12 450</TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal class="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Voir détails</DropdownMenuItem>
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">Rentrée fidélité</TableCell>
                <TableCell>Fidélisation</TableCell>
                <TableCell><CampaignStatusBadge status="scheduled" /></TableCell>
                <TableCell class="text-right tabular-nums">8 200</TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal class="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Voir détails</DropdownMenuItem>
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">Test message noel</TableCell>
                <TableCell>Prospection</TableCell>
                <TableCell><CampaignStatusBadge status="draft" /></TableCell>
                <TableCell class="text-right tabular-nums">—</TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal class="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Voir détails</DropdownMenuItem>
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Tabs -->
        <h3 class="mt-6 text-lg font-medium">Tabs</h3>
        <Tabs default-value="sms" class="mt-3 max-w-lg">
          <TabsList>
            <TabsTrigger value="sms">Stats SMS</TabsTrigger>
            <TabsTrigger value="lp">Landing Page</TabsTrigger>
            <TabsTrigger value="url">Short URL</TabsTrigger>
          </TabsList>
          <TabsContent value="sms" class="mt-3">
            <p class="text-sm text-muted-foreground">Envoyés : 12 450 — Délivrés : 11 893 — Taux : 95.5%</p>
          </TabsContent>
          <TabsContent value="lp" class="mt-3">
            <p class="text-sm text-muted-foreground">Sessions : 3 420 — Visiteurs uniques : 2 891</p>
          </TabsContent>
          <TabsContent value="url" class="mt-3">
            <p class="text-sm text-muted-foreground">Clics totaux : 4 102 — Clics uniques : 3 247</p>
          </TabsContent>
        </Tabs>

        <!-- Accordion -->
        <h3 class="mt-6 text-lg font-medium">Accordion</h3>
        <Accordion type="single" collapsible class="mt-3 max-w-lg">
          <AccordionItem value="item-1">
            <AccordionTrigger>Configuration SMS</AccordionTrigger>
            <AccordionContent>
              Paramètres d'envoi SMS : expéditeur, encodage GSM-7/UCS-2, mention STOP obligatoire.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Ciblage géographique</AccordionTrigger>
            <AccordionContent>
              Ciblage par code postal, département, adresse avec rayon. Groupes d'intérêts combinables (ET/OU).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Planification</AccordionTrigger>
            <AccordionContent>
              Envoi immédiat ou planifié. Fenêtre d'envoi 8h-20h (Europe/Paris). Support multi-vagues.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 10. EMPTY & ERROR STATES -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Empty & Error States</h2>

        <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle class="text-sm">EmptyState — Campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                :icon="Send"
                title="Aucune campagne"
                description="Créez votre première campagne SMS pour toucher vos clients."
                action-label="Nouvelle campagne"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-sm">ErrorState — Serveur</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorState
                title="Erreur serveur"
                description="Une erreur inattendue s'est produite. Réessayez dans quelques instants."
              />
            </CardContent>
          </Card>
        </div>

        <!-- PageSkeleton -->
        <h3 class="mt-6 text-lg font-medium">PageSkeleton</h3>
        <div class="mt-3 flex gap-2">
          <Button
            v-for="v in ['cards', 'table', 'full'] as const"
            :key="v"
            size="sm"
            :variant="skeletonVariant === v ? 'default' : 'outline'"
            @click="skeletonVariant = v"
          >
            {{ v }}
          </Button>
        </div>
        <Card class="mt-3">
          <CardContent class="pt-6">
            <PageSkeleton :variant="skeletonVariant" />
          </CardContent>
        </Card>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 11. OVERLAYS -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Overlays</h2>

        <div class="mt-6 flex flex-wrap gap-3">
          <!-- Dialog -->
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="outline" size="sm">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le profil</DialogTitle>
                <DialogDescription>Mettez à jour vos informations personnelles.</DialogDescription>
              </DialogHeader>
              <div class="space-y-4 py-4">
                <div class="space-y-2">
                  <Label>Nom</Label>
                  <Input model-value="Jean Dupont" />
                </div>
                <div class="space-y-2">
                  <Label>Email</Label>
                  <Input model-value="jean@wellpack.fr" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Annuler</Button>
                <Button>Sauvegarder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <!-- Sheet -->
          <Sheet>
            <SheetTrigger as-child>
              <Button variant="outline" size="sm">Sheet (Drawer)</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation mobile</SheetTitle>
                <SheetDescription>Simulation du sidebar en mode mobile (Sheet).</SheetDescription>
              </SheetHeader>
              <div class="mt-6 space-y-2">
                <Button variant="ghost" class="w-full justify-start"><Send class="mr-2 size-4" />Campagnes</Button>
                <Button variant="ghost" class="w-full justify-start"><MapPin class="mr-2 size-4" />Boutiques</Button>
                <Button variant="ghost" class="w-full justify-start"><Layout class="mr-2 size-4" />Landing Pages</Button>
                <Button variant="ghost" class="w-full justify-start"><BarChart3 class="mr-2 size-4" />Statistiques</Button>
                <Button variant="ghost" class="w-full justify-start"><Settings class="mr-2 size-4" />Paramètres</Button>
              </div>
            </SheetContent>
          </Sheet>

          <!-- Popover -->
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">Popover</Button>
            </PopoverTrigger>
            <PopoverContent class="w-64">
              <div class="space-y-2">
                <h4 class="font-medium">Estimation de coût</h4>
                <p class="text-sm text-muted-foreground">Volume : 12 450 SMS</p>
                <p class="text-sm text-muted-foreground">Coût estimé : <strong>498,00 €</strong></p>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Tooltip -->
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="sm">Tooltip (hover)</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Les stats sont disponibles 72h après l'envoi</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <!-- Dropdown Menu -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">
                DropdownMenu
                <ChevronRight class="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive">Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <Separator class="my-10" />

      <!-- ============================================================ -->
      <!-- 12. SPACING & SHADOWS -->
      <!-- ============================================================ -->
      <section>
        <h2 class="text-2xl font-semibold">Spacing & Shadows</h2>

        <h3 class="mt-6 text-lg font-medium">Shadows</h3>
        <div class="mt-3 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div class="flex flex-col items-center gap-2">
            <div class="h-20 w-full rounded-lg bg-card shadow-xs" />
            <span class="text-xs text-muted-foreground">shadow-xs</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-20 w-full rounded-lg bg-card shadow-sm" />
            <span class="text-xs text-muted-foreground">shadow-sm</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-20 w-full rounded-lg bg-card shadow-md" />
            <span class="text-xs text-muted-foreground">shadow-md</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-20 w-full rounded-lg bg-card shadow-lg" />
            <span class="text-xs text-muted-foreground">shadow-lg</span>
          </div>
        </div>

        <h3 class="mt-6 text-lg font-medium">Focus Ring</h3>
        <div class="mt-3 flex gap-4">
          <Input class="max-w-xs" placeholder="Cliquer pour voir le focus ring" />
          <Button>Focus me</Button>
        </div>

        <h3 class="mt-6 text-lg font-medium">Border Radius</h3>
        <div class="mt-3 flex flex-wrap items-end gap-4">
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-sm border bg-card" />
            <span class="text-xs text-muted-foreground">sm (4px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-md border bg-card" />
            <span class="text-xs text-muted-foreground">md (6px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-lg border bg-card" />
            <span class="text-xs text-muted-foreground">lg (8px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-xl border bg-card" />
            <span class="text-xs text-muted-foreground">xl (12px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-2xl border bg-card" />
            <span class="text-xs text-muted-foreground">2xl (16px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 rounded-full border bg-card" />
            <span class="text-xs text-muted-foreground">full</span>
          </div>
        </div>
      </section>

      <!-- Bottom spacer -->
      <div class="h-20" />
    </div>
  </div>
</template>
