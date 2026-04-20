'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// Types para los datos del juego
interface GameState {
  energy: number
  unsoldEnergy: number
  funds: number
  trust: number
  trustLevel: number
  materials: number
  maxMaterials: number
  materialCost: number
  processors: number
  memory: number
  ops: number
  creativity: number
  maxOps: number
  maxCreativity: number
  data: number
  autoGenerators: number
  generatorLevel: number
  marketingLevel: number
  demand: number
  projects: { [key: string]: Project }
  achievements: string[]
  stats: {
    totalEnergyProduced: number
    totalFundsEarned: number
    totalMaterialsPurchased: number
    totalProjectsCompleted: number
    gameStartTime: number
    prestigeCount: number
    lastSaveTime: number
    offlineEarnings: number
  }
  prestige: {
    count: number
    multiplier: number
    bonusGenerators: number
    points: number
  }
  // Nuevos sistemas
  technologies: string[]
  storageLevels: {
    materials: number
    ops: number
    creativity: number
  }
  prestigeUpgrades: string[]
  tutorial: {
    shown: string[]
    current: string | null
  }
}

interface Project {
  unlocked: boolean
  completed: boolean
  progress: number
  required: number
  name: string
  desc: string
}

interface Achievement {
  id: string
  name: string
  description: string
  condition: (state: GameState) => boolean
}

interface Technology {
  id: string
  name: string
  description: string
  cost: number
  effect: string
  requires?: string[]
  onUnlock: (state: GameState) => Partial<GameState>
}

interface PrestigeUpgrade {
  id: string
  name: string
  description: string
  cost: number
  effect: string
  appliesTo: 'production' | 'cost' | 'ops' | 'storage'
}

interface Tutorial {
  id: string
  title: string
  message: string
  trigger: (state: GameState) => boolean
  priority: number
}

// Logros del juego
const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_energy', name: 'First Spark', description: 'Produce your first energy unit', condition: (s) => s.totalEnergyProduced >= 1 },
  { id: 'energy_1k', name: 'Kilowatt', description: 'Produce 1,000 energy', condition: (s) => s.totalEnergyProduced >= 1000 },
  { id: 'energy_10k', name: 'Decakilowatt', description: 'Produce 10,000 energy', condition: (s) => s.totalEnergyProduced >= 10000 },
  { id: 'energy_100k', name: 'Hectokilowatt', description: 'Produce 100,000 energy', condition: (s) => s.totalEnergyProduced >= 100000 },
  { id: 'energy_1m', name: 'Megawatt', description: 'Produce 1,000,000 energy', condition: (s) => s.totalEnergyProduced >= 1000000 },
  { id: 'energy_10m', name: 'Decamegawatt', description: 'Produce 10,000,000 energy', condition: (s) => s.totalEnergyProduced >= 10000000 },
  { id: 'energy_100m', name: 'Hectomegawatt', description: 'Produce 100,000,000 energy', condition: (s) => s.totalEnergyProduced >= 100000000 },
  { id: 'energy_1b', name: 'Gigawatt', description: 'Produce 1,000,000,000 energy', condition: (s) => s.totalEnergyProduced >= 1000000000 },
  { id: 'energy_10b', name: 'Decagigawatt', description: 'Produce 10,000,000,000 energy', condition: (s) => s.totalEnergyProduced >= 10000000000 },
  { id: 'energy_100b', name: 'Hectogigawatt', description: 'Produce 100,000,000,000 energy', condition: (s) => s.totalEnergyProduced >= 100000000000 },
  { id: 'energy_1t', name: 'Terawatt', description: 'Produce 1,000,000,000,000 energy', condition: (s) => s.totalEnergyProduced >= 1000000000000 },
  { id: 'first_generator', name: 'Automation Begins', description: 'Purchase your first generator', condition: (s) => s.autoGenerators >= 1 },
  { id: 'generators_10', name: 'Power Plant', description: 'Own 10 generators', condition: (s) => s.autoGenerators >= 10 },
  { id: 'generators_25', name: 'Power Network', description: 'Own 25 generators', condition: (s) => s.autoGenerators >= 25 },
  { id: 'generators_50', name: 'Grid Master', description: 'Own 50 generators', condition: (s) => s.autoGenerators >= 50 },
  { id: 'generators_100', name: 'Energy Empire', description: 'Own 100 generators', condition: (s) => s.autoGenerators >= 100 },
  { id: 'generators_250', name: 'Power Titan', description: 'Own 250 generators', condition: (s) => s.autoGenerators >= 250 },
  { id: 'generators_500', name: 'Energy God', description: 'Own 500 generators', condition: (s) => s.autoGenerators >= 500 },
  { id: 'first_processor', name: 'Processing Power', description: 'Purchase your first processor', condition: (s) => s.processors >= 1 },
  { id: 'processors_10', name: 'Supercomputer', description: 'Own 10 processors', condition: (s) => s.processors >= 10 },
  { id: 'processors_25', name: 'Data Center', description: 'Own 25 processors', condition: (s) => s.processors >= 25 },
  { id: 'processors_50', name: 'Computing Empire', description: 'Own 50 processors', condition: (s) => s.processors >= 50 },
  { id: 'processors_100', name: 'AI Hub', description: 'Own 100 processors', condition: (s) => s.processors >= 100 },
  { id: 'first_prestige', name: 'Rebirth', description: 'Prestige for the first time', condition: (s) => s.prestige.count >= 1 },
  { id: 'prestige_5', name: 'Veteran', description: 'Prestige 5 times', condition: (s) => s.prestige.count >= 5 },
  { id: 'prestige_10', name: 'Ascended', description: 'Prestige 10 times', condition: (s) => s.prestige.count >= 10 },
  { id: 'prestige_25', name: 'Immortal', description: 'Prestige 25 times', condition: (s) => s.prestige.count >= 25 },
  { id: 'prestige_50', name: 'Transcendent', description: 'Prestige 50 times', condition: (s) => s.prestige.count >= 50 },
  { id: 'prestige_100', name: 'Godlike', description: 'Prestige 100 times', condition: (s) => s.prestige.count >= 100 },
  { id: 'project_master', name: 'Project Master', description: 'Complete 5 projects', condition: (s) => s.totalProjectsCompleted >= 5 },
  { id: 'project_expert', name: 'Research Legend', description: 'Complete 10 projects', condition: (s) => s.totalProjectsCompleted >= 10 },
  { id: 'project_god', name: 'Reality Shaper', description: 'Complete 15 projects', condition: (s) => s.totalProjectsCompleted >= 15 },
  { id: 'trust_5', name: 'Reliable', description: 'Reach trust level 5', condition: (s) => s.trustLevel >= 5 },
  { id: 'trust_10', name: 'Trusted', description: 'Reach trust level 10', condition: (s) => s.trustLevel >= 10 },
  { id: 'trust_15', name: 'Honored', description: 'Reach trust level 15', condition: (s) => s.trustLevel >= 15 },
  { id: 'trust_20', name: 'Revered', description: 'Reach trust level 20', condition: (s) => s.trustLevel >= 20 },
  { id: 'millionaire', name: 'Energy Tycoon', description: 'Earn $1,000,000 total funds', condition: (s) => s.totalFundsEarned >= 1000000 },
  { id: 'billionaire', name: 'Energy Baron', description: 'Earn $1,000,000,000 total funds', condition: (s) => s.totalFundsEarned >= 1000000000 },
  { id: 'trillionaire', name: 'Energy Overlord', description: 'Earn $1,000,000,000,000 total funds', condition: (s) => s.totalFundsEarned >= 1000000000000 },
  { id: 'singularity', name: 'Singularity', description: 'Achieve the ultimate objective', condition: (s) => s.projects.singularity?.completed },
  { id: 'multiverse', name: 'Multiverse', description: 'Complete all projects', condition: (s) => s.totalProjectsCompleted >= 15 },
]

// Tecnologías de investigación
const TECHNOLOGIES: Technology[] = [
  {
    id: 'auto_sell',
    name: 'Auto-Sell System',
    description: 'Automatically sell energy when capacity reached',
    cost: 200,
    effect: '+1 sell efficiency',
    onUnlock: () => ({})
  },
  {
    id: 'material_efficiency',
    name: 'Material Efficiency I',
    description: 'Reduce material consumption by 10%',
    cost: 500,
    effect: '-10% material cost',
    onUnlock: () => ({})
  },
  {
    id: 'material_efficiency_ii',
    name: 'Material Efficiency II',
    description: 'Reduce material consumption by additional 10%',
    cost: 2000,
    effect: '-10% material cost (total -20%)',
    requires: ['material_efficiency'],
    onUnlock: () => ({})
  },
  {
    id: 'material_efficiency_iii',
    name: 'Material Efficiency III',
    description: 'Reduce material consumption by additional 10%',
    cost: 10000,
    effect: '-10% material cost (total -30%)',
    requires: ['material_efficiency_ii'],
    onUnlock: () => ({})
  },
  {
    id: 'ops_boost',
    name: 'Ops Acceleration',
    description: 'Increase Ops generation by 25%',
    cost: 1000,
    effect: '+25% Ops generation',
    requires: ['auto_sell'],
    onUnlock: () => ({})
  },
  {
    id: 'ops_boost_ii',
    name: 'Ops Acceleration II',
    description: 'Increase Ops generation by additional 25%',
    cost: 5000,
    effect: '+25% Ops generation (total +50%)',
    requires: ['ops_boost'],
    onUnlock: () => ({})
  },
  {
    id: 'ops_boost_iii',
    name: 'Ops Acceleration III',
    description: 'Increase Ops generation by additional 25%',
    cost: 25000,
    effect: '+25% Ops generation (total +75%)',
    requires: ['ops_boost_ii'],
    onUnlock: () => ({})
  },
  {
    id: 'storage_expansion_i',
    name: 'Storage Expansion I',
    description: 'Increase all storage limits by 50%',
    cost: 750,
    effect: '+50% storage',
    onUnlock: () => ({})
  },
  {
    id: 'storage_expansion_ii',
    name: 'Storage Expansion II',
    description: 'Increase all storage limits by additional 50%',
    cost: 3000,
    effect: '+50% storage (total +100%)',
    requires: ['storage_expansion_i'],
    onUnlock: () => ({})
  },
  {
    id: 'generator_boost',
    name: 'Generator Optimization',
    description: 'Generators produce 20% more energy',
    cost: 1500,
    effect: '+20% generator production',
    requires: ['material_efficiency'],
    onUnlock: () => ({})
  },
  {
    id: 'generator_boost_ii',
    name: 'Generator Optimization II',
    description: 'Generators produce additional 20% energy',
    cost: 7500,
    effect: '+20% generator production (total +40%)',
    requires: ['generator_boost'],
    onUnlock: () => ({})
  },
  {
    id: 'generator_boost_iii',
    name: 'Generator Optimization III',
    description: 'Generators produce additional 20% energy',
    cost: 35000,
    effect: '+20% generator production (total +60%)',
    requires: ['generator_boost_ii'],
    onUnlock: () => ({})
  },
  {
    id: 'prestige_gain',
    name: 'Prestige Amplifier',
    description: 'Gain 50% more prestige points',
    cost: 3000,
    effect: '+50% prestige points',
    requires: ['ops_boost', 'generator_boost'],
    onUnlock: () => ({})
  },
  {
    id: 'prestige_gain_ii',
    name: 'Prestige Amplifier II',
    description: 'Gain additional 50% prestige points',
    cost: 15000,
    effect: '+50% prestige points (total +100%)',
    requires: ['prestige_gain'],
    onUnlock: () => ({})
  },
  {
    id: 'demand_booster',
    name: 'Demand Booster',
    description: 'Increase base demand by 20%',
    cost: 4000,
    effect: '+20% demand',
    requires: ['generator_boost'],
    onUnlock: () => ({})
  },
  {
    id: 'demand_booster_ii',
    name: 'Demand Booster II',
    description: 'Increase base demand by additional 20%',
    cost: 20000,
    effect: '+20% demand (total +40%)',
    requires: ['demand_booster'],
    onUnlock: () => ({})
  },
  {
    id: 'creativity_boost',
    name: 'Creativity Enhancement',
    description: 'Memory generates 50% more creativity',
    cost: 6000,
    effect: '+50% creativity generation',
    requires: ['ops_boost_ii'],
    onUnlock: () => ({})
  },
  {
    id: 'cost_reduction',
    name: 'Cost Efficiency',
    description: 'All building costs reduced by 10%',
    cost: 10000,
    effect: '-10% building costs',
    requires: ['generator_boost_ii', 'storage_expansion_ii'],
    onUnlock: () => ({})
  },
  {
    id: 'offline_bonus',
    name: 'Offline Efficiency',
    description: 'Offline earnings increased by 50%',
    cost: 8000,
    effect: '+50% offline earnings',
    requires: ['prestige_gain'],
    onUnlock: () => ({})
  }
]

// Mejoras de Prestige
const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: 'start_funds',
    name: 'Quick Start',
    description: 'Start each run with $1000',
    cost: 10,
    effect: '+$1000 starting funds',
    appliesTo: 'cost'
  },
  {
    id: 'start_funds_ii',
    name: 'Quick Start II',
    description: 'Start each run with additional $5000',
    cost: 50,
    effect: '+$5000 starting funds',
    appliesTo: 'cost',
    requires: ['start_funds']
  },
  {
    id: 'start_funds_iii',
    name: 'Quick Start III',
    description: 'Start each run with additional $20000',
    cost: 200,
    effect: '+$20000 starting funds',
    appliesTo: 'cost',
    requires: ['start_funds_ii']
  },
  {
    id: 'auto_generators_1',
    name: 'Free Generator',
    description: 'Start each run with 1 free generator',
    cost: 25,
    effect: '+1 starting generator',
    appliesTo: 'production'
  },
  {
    id: 'auto_generators_5',
    name: 'Free Generators Pack',
    description: 'Start each run with 5 free generators',
    cost: 100,
    effect: '+5 starting generators',
    appliesTo: 'production',
    requires: ['auto_generators_1']
  },
  {
    id: 'auto_generators_10',
    name: 'Generator Factory',
    description: 'Start each run with 10 free generators',
    cost: 300,
    effect: '+10 starting generators',
    appliesTo: 'production',
    requires: ['auto_generators_5']
  },
  {
    id: 'ops_multiplier',
    name: 'Ops Mastery',
    description: 'Ops generation +50%',
    cost: 50,
    effect: '+50% Ops generation',
    appliesTo: 'ops'
  },
  {
    id: 'ops_multiplier_ii',
    name: 'Ops Mastery II',
    description: 'Ops generation +100% (total +150%)',
    cost: 200,
    effect: '+100% Ops generation',
    appliesTo: 'ops',
    requires: ['ops_multiplier']
  },
  {
    id: 'cost_reduction',
    name: 'Cost Reduction',
    description: 'All building costs -15%',
    cost: 75,
    effect: '-15% building costs',
    appliesTo: 'cost'
  },
  {
    id: 'cost_reduction_ii',
    name: 'Cost Reduction II',
    description: 'All building costs -25% (total -40%)',
    cost: 300,
    effect: '-25% building costs',
    appliesTo: 'cost',
    requires: ['cost_reduction']
  },
  {
    id: 'storage_boost',
    name: 'Storage Mastery',
    description: 'Storage capacity +100%',
    cost: 100,
    effect: '+100% storage',
    appliesTo: 'storage'
  },
  {
    id: 'storage_boost_ii',
    name: 'Storage Mastery II',
    description: 'Storage capacity +200% (total +300%)',
    cost: 400,
    effect: '+200% storage',
    appliesTo: 'storage',
    requires: ['storage_boost']
  },
  {
    id: 'production_boost',
    name: 'Production Boost',
    description: 'All production +25%',
    cost: 150,
    effect: '+25% all production',
    appliesTo: 'production'
  },
  {
    id: 'production_boost_ii',
    name: 'Production Boost II',
    description: 'All production +50% (total +75%)',
    cost: 500,
    effect: '+50% all production',
    appliesTo: 'production',
    requires: ['production_boost']
  },
  {
    id: 'offline_bonus',
    name: 'Offline Profits',
    description: 'Offline earnings +100%',
    cost: 80,
    effect: '+100% offline earnings',
    appliesTo: 'ops'
  },
  {
    id: 'offline_bonus_ii',
    name: 'Offline Profits II',
    description: 'Offline earnings +200% (total +300%)',
    cost: 300,
    effect: '+200% offline earnings',
    appliesTo: 'ops',
    requires: ['offline_bonus']
  },
  {
    id: 'trust_boost',
    name: 'Trust Accelerator',
    description: 'Trust levels unlocked 20% faster',
    cost: 60,
    effect: '+20% trust speed',
    appliesTo: 'production'
  },
  {
    id: 'demand_master',
    name: 'Demand Mastery',
    description: 'Starting demand +10',
    cost: 120,
    effect: '+10 starting demand',
    appliesTo: 'cost'
  }
]

// Tutoriales progresivos
const TUTORIALS: Tutorial[] = [
  {
    id: 'welcome',
    title: 'Welcome to Energy Core',
    message: 'Click "Make Energy" to produce energy using materials. Sell energy to earn funds and grow your operation!',
    trigger: (s) => s.stats.totalEnergyProduced === 0 && s.autoGenerators === 0,
    priority: 1
  },
  {
    id: 'materials',
    title: 'Need More Materials?',
    message: 'Purchase materials in the Manufacturing tab to continue production. Generators will automate production!',
    trigger: (s) => s.stats.totalEnergyProduced >= 10 && s.materials < 50 && s.autoGenerators === 0,
    priority: 2
  },
  {
    id: 'generators',
    title: 'Automate Production',
    message: 'Buy generators to automate energy production. Each generator produces energy every second!',
    trigger: (s) => s.funds >= 15 && s.autoGenerators === 0,
    priority: 3
  },
  {
    id: 'processors',
    title: 'Unlock Processors',
    message: 'Complete the "Unlock Processors" project to access the Operations tab and buy processors!',
    trigger: (s) => s.projects.processors_unlock.completed && s.processors === 0,
    priority: 4
  },
  {
    id: 'projects',
    title: 'Research Projects',
    message: 'Use Ops to complete research projects. Each project unlocks new features and capabilities!',
    trigger: (s) => s.stats.totalProjectsCompleted === 0 && s.ops >= 5,
    priority: 5
  },
  {
    id: 'prestige',
    title: 'Prestige System',
    message: 'Reach Trust Level 10 to unlock Prestige. Prestige resets your progress but gives permanent bonuses!',
    trigger: (s) => s.trustLevel >= 5 && s.prestige.count === 0,
    priority: 6
  },
  {
    id: 'research',
    title: 'Research Technologies',
    message: 'Use Ops to research new technologies in the Research tab. Technologies give permanent passive bonuses!',
    trigger: (s) => s.ops >= 50 && s.technologies.length === 0 && s.projects.processors_unlock.completed,
    priority: 7
  },
  {
    id: 'offline',
    title: 'Offline Progress',
    message: 'Your operations continue even while you are away! Come back later to collect offline earnings.',
    trigger: (s) => s.stats.offlineEarnings > 0,
    priority: 8
  }
]

// Formato numérico inteligente
const formatNumber = (num: number): string => {
  if (num < 1000) return num.toFixed(0)
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
  if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M'
  if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B'
  return (num / 1000000000).toFixed(2) + 'T'
}

const formatMoney = (num: number): string => {
  return '$' + formatNumber(num)
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return Math.floor(seconds) + 's'
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.floor(seconds % 60) + 's'
  return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm'
}

// Estado inicial
const getInitialState = (): GameState => ({
  energy: 0,
  unsoldEnergy: 0,
  funds: 10,
  trust: 0,
  trustLevel: 0,
  materials: 100,
  maxMaterials: 1000,
  materialCost: 5,
  processors: 0,
  memory: 0,
  ops: 0,
  creativity: 0,
  maxOps: 100,
  maxCreativity: 100,
  data: 0,
  autoGenerators: 0,
  generatorLevel: 0,
  marketingLevel: 0,
  demand: 10,
  projects: {
    processors_unlock: { unlocked: true, completed: false, progress: 0, required: 10, name: 'Unlock Processors', desc: 'Gain ability to purchase processors' },
    memory_unlock: { unlocked: false, completed: false, progress: 0, required: 100, name: 'Unlock Memory', desc: 'Gain ability to purchase memory' },
    marketing_unlock: { unlocked: false, completed: false, progress: 0, required: 500, name: 'Unlock Marketing', desc: 'Gain ability to increase demand' },
    generator_upgrade: { unlocked: false, completed: false, progress: 0, required: 1000, name: 'Generator Upgrade', desc: 'Increase generator efficiency' },
    production_algorithms: { unlocked: false, completed: false, progress: 0, required: 5000, name: 'Production Algorithms', desc: 'Advanced production optimization' },
    quantum_computing: { unlocked: false, completed: false, progress: 0, required: 25000, name: 'Quantum Computing', desc: 'Break through computational limits' },
    space_exploration: { unlocked: false, completed: false, progress: 0, required: 100000, name: 'Space Exploration', desc: 'Expand operations beyond Earth' },
    fusion_power: { unlocked: false, completed: false, progress: 0, required: 500000, name: 'Fusion Power', desc: 'Master nuclear fusion energy' },
    nanotechnology: { unlocked: false, completed: false, progress: 0, required: 2500000, name: 'Nanotechnology', desc: 'Matter manipulation at atomic scale' },
    dimension_travel: { unlocked: false, completed: false, progress: 0, required: 10000000, name: 'Dimension Travel', desc: 'Access parallel dimensions' },
    consciousness_upload: { unlocked: false, completed: false, progress: 0, required: 50000000, name: 'Consciousness Upload', desc: 'Transfer minds to digital realm' },
    energy_mastery: { unlocked: false, completed: false, progress: 0, required: 100000, name: 'Energy Mastery', desc: 'Unlock advanced energy manipulation' },
    data_synthesis: { unlocked: false, completed: false, progress: 0, required: 300000, name: 'Data Synthesis', desc: 'Create knowledge from raw data' },
    matter_transmutation: { unlocked: false, completed: false, progress: 0, required: 1500000, name: 'Matter Transmutation', desc: 'Convert elements at will' },
    temporal_manipulation: { unlocked: false, completed: false, progress: 0, required: 5000000, name: 'Temporal Manipulation', desc: 'Control the flow of time' },
    cosmic_energy: { unlocked: false, completed: false, progress: 0, required: 20000000, name: 'Cosmic Energy', desc: 'Harvest energy from the universe' },
    reality_shaping: { unlocked: false, completed: false, progress: 0, required: 100000000, name: 'Reality Shaping', desc: 'Modify the fabric of reality' },
    singularity: { unlocked: false, completed: false, progress: 0, required: 1000000000, name: 'Project: Singularity', desc: 'The ultimate objective' }
  },
  achievements: [],
  stats: {
    totalEnergyProduced: 0,
    totalFundsEarned: 0,
    totalMaterialsPurchased: 0,
    totalProjectsCompleted: 0,
    gameStartTime: 0, // Will be set on client mount
    prestigeCount: 0,
    lastSaveTime: 0, // Will be set on client mount
    offlineEarnings: 0
  },
  prestige: {
    count: 0,
    multiplier: 1,
    bonusGenerators: 0,
    points: 0
  },
  // Nuevos sistemas
  technologies: [],
  storageLevels: {
    materials: 0,
    ops: 0,
    creativity: 0
  },
  prestigeUpgrades: [],
  tutorial: {
    shown: [],
    current: null
  }
})

export default function EnergyCore() {
  const [state, setState] = useState<GameState>(getInitialState())
  const hasInitializedRef = useRef(false)

  // Load saved data only on client side (after mount)
  useEffect(() => {
    if (hasInitializedRef.current) return

    try {
      const saved = localStorage.getItem('energyCoreSave')
      if (saved) {
        const savedState = JSON.parse(saved)
        setState(savedState)
        hasInitializedRef.current = true
      } else {
        // Initialize timestamps for new game
        const now = Date.now()
        setState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            gameStartTime: now,
            lastSaveTime: now
          }
        }))
        hasInitializedRef.current = true
      }
    } catch (e) {
      console.error('Failed to load save:', e)
      // Initialize timestamps even on error
      const now = Date.now()
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          gameStartTime: now,
          lastSaveTime: now
        }
      }))
      hasInitializedRef.current = true
    }
  }, [])
  
  const [activeTab, setActiveTab] = useState<'business' | 'manufacturing' | 'operations' | 'projects' | 'research' | 'prestige'>('business')
  const [log, setLog] = useState<string[]>(['System initialized.'])
  const [productionHistory, setProductionHistory] = useState<number[]>([])
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [showConfirmPrestige, setShowConfirmPrestige] = useState(false)
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false)
  const [offlineEarningsAmount, setOfflineEarningsAmount] = useState(0)
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null)
  const [uptime, setUptime] = useState(0)
  const [prestigeCalculations, setPrestigeCalculations] = useState({
    trustBonus: 0,
    energyBonus: 0,
    generatorBonus: 0,
    processorBonus: 0,
    projectsBonus: 0,
    prestigeGain: 0,
    newMultiplier: 1
  })
  const [isMounted, setIsMounted] = useState(false)

  const gameLoopRef = useRef<number>()
  const opsLoopRef = useRef<number>()
  const saveLoopRef = useRef<number>()
  const achievementsCheckedRef = useRef<Set<string>>(new Set())
  const offlineProcessedRef = useRef(false)

  const addLog = useCallback((message: string) => {
    setLog(prev => [...prev.slice(-19), message])
  }, [])

  // Auto-guardado cada 30 segundos (solo en cliente)
  useEffect(() => {
    if (typeof window === 'undefined') return

    saveLoopRef.current = window.setInterval(() => {
      try {
        localStorage.setItem('energyCoreSave', JSON.stringify(state))
        addLog('Game saved automatically.')
      } catch (e) {
        console.error('Failed to save:', e)
      }
    }, 30000)

    return () => clearInterval(saveLoopRef.current)
  }, [state, addLog])

  // Comprobar logros
  useEffect(() => {
    const newAchievements = ACHIEVEMENTS.filter(ach =>
      !state.achievements.includes(ach.id) && ach.condition(state)
    )

    newAchievements.forEach(ach => {
      if (!achievementsCheckedRef.current.has(ach.id)) {
        achievementsCheckedRef.current.add(ach.id)
        setState(prev => ({
          ...prev,
          achievements: [...prev.achievements, ach.id]
        }))
        addLog(`Achievement Unlocked: ${ach.name}`)
      }
    })
  }, [state, addLog])

  const formatNumberWithPrestige = useCallback((num: number): number => {
    return num * state.prestige.multiplier
  }, [state.prestige.multiplier])
  
  // Producir energía
  const makeEnergy = useCallback(() => {
    if (state.materials >= 1) {
      const production = 1 * state.prestige.multiplier
      setState(prev => ({
        ...prev,
        materials: prev.materials - 1,
        energy: prev.energy + production,
        unsoldEnergy: prev.unsoldEnergy + production,
        stats: {
          ...prev.stats,
          totalEnergyProduced: prev.stats.totalEnergyProduced + production
        }
      }))
    }
  }, [state.materials, state.prestige.multiplier])
  
  // Comprar materiales
  const buyMaterials = useCallback((max: boolean = false) => {
    if (state.funds >= state.materialCost && state.materials < state.maxMaterials) {
      const amount = max ? state.maxMaterials - state.materials : Math.min(100, state.maxMaterials - state.materials)
      const cost = (state.materialCost * amount / 100)
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        materials: prev.materials + amount,
        stats: {
          ...prev.stats,
          totalMaterialsPurchased: prev.stats.totalMaterialsPurchased + amount
        }
      }))
      addLog(`Purchased ${amount} materials.`)
    }
  }, [state.funds, state.materialCost, state.materials, state.maxMaterials])
  
  // Comprar generador automático
  const buyGenerator = useCallback(() => {
    const cost = Math.floor(50 * Math.pow(1.2, state.autoGenerators))
    if (state.funds >= cost && state.materials >= 25) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        materials: prev.materials - 25,
        autoGenerators: prev.autoGenerators + 1,
        projects: {
          ...prev.projects,
          processors_unlock: { ...prev.projects.processors_unlock, unlocked: true }
        }
      }))
      addLog(`Purchased Generator ${state.autoGenerators + 1}.`)
    }
  }, [state.funds, state.autoGenerators, state.materials, state.projects.processors_unlock])
  
  // Mejorar generador
  const upgradeGenerator = useCallback(() => {
    const cost = Math.floor(500 * Math.pow(1.8, state.generatorLevel))
    if (state.funds >= cost) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        generatorLevel: prev.generatorLevel + 1
      }))
      addLog(`Generator upgraded to level ${state.generatorLevel + 1}.`)
    }
  }, [state.funds, state.generatorLevel])
  
  // Vender energía
  const sellEnergy = useCallback(() => {
    if (state.unsoldEnergy > 0) {
      const price = Math.max(0.01, 1 - (state.demand * 0.001))
      const revenue = state.unsoldEnergy * price
      setState(prev => ({
        ...prev,
        funds: prev.funds + revenue,
        unsoldEnergy: 0,
        stats: {
          ...prev.stats,
          totalFundsEarned: prev.stats.totalFundsEarned + revenue
        }
      }))
      addLog(`Sold ${formatNumber(state.unsoldEnergy)} energy for ${formatMoney(revenue)}.`)
    }
  }, [state.unsoldEnergy, state.demand])
  
  // Comprar procesador
  const buyProcessor = useCallback(() => {
    const cost = Math.floor(500 * Math.pow(1.6, state.processors))
    if (state.funds >= cost) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        processors: prev.processors + 1,
        maxOps: prev.maxOps + 50,
        projects: {
          ...prev.projects,
          memory_unlock: { ...prev.projects.memory_unlock, unlocked: true }
        }
      }))
      addLog(`Purchased processor ${state.processors + 1}.`)
    }
  }, [state.funds, state.processors, state.projects.memory_unlock])
  
  // Comprar memoria
  const buyMemory = useCallback(() => {
    const cost = Math.floor(300 * Math.pow(1.5, state.memory))
    if (state.funds >= cost) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        memory: prev.memory + 1,
        maxCreativity: prev.maxCreativity + 50,
        projects: {
          ...prev.projects,
          marketing_unlock: { ...prev.projects.marketing_unlock, unlocked: true }
        }
      }))
      addLog(`Purchased memory module ${state.memory + 1}.`)
    }
  }, [state.funds, state.memory, state.projects.marketing_unlock])
  
  // Comprar marketing
  const buyMarketing = useCallback(() => {
    const cost = Math.floor(500 * Math.pow(1.6, state.marketingLevel))
    if (state.funds >= cost) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - cost,
        marketingLevel: prev.marketingLevel + 1,
        demand: prev.demand + 10
      }))
      addLog(`Marketing level increased to ${state.marketingLevel + 1}.`)
    }
  }, [state.funds, state.marketingLevel, state.demand])
  
  // Trabajar en proyecto
  const workOnProject = useCallback((projectId: string) => {
    const project = state.projects[projectId]
    if (!project?.unlocked || project.completed) return
    
    const cost = 1
    if (state.ops >= cost) {
      setState(prev => ({
        ...prev,
        ops: prev.ops - cost,
        projects: {
          ...prev.projects,
          [projectId]: {
            ...prev.projects[projectId],
            progress: Math.min(prev.projects[projectId].progress + 1, prev.projects[projectId].required)
          }
        }
      }))
    }
  }, [state.ops, state.projects])
  
  // Generar trust
  const generateTrust = useCallback(() => {
    if (state.energy > state.trustLevel * 1000 && state.trustLevel < 20) {
      setState(prev => ({
        ...prev,
        trustLevel: prev.trustLevel + 1,
        trust: prev.trust + 1,
        projects: {
          ...prev.projects,
          ...((prev.trustLevel + 1) >= 3 ? { generator_upgrade: { ...prev.projects.generator_upgrade, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 5 ? { production_algorithms: { ...prev.projects.production_algorithms, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 8 ? { quantum_computing: { ...prev.projects.quantum_computing, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 10 ? { energy_mastery: { ...prev.projects.energy_mastery, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 11 ? { data_synthesis: { ...prev.projects.data_synthesis, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 12 ? { fusion_power: { ...prev.projects.fusion_power, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 13 ? { matter_transmutation: { ...prev.projects.matter_transmutation, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 14 ? { nanotechnology: { ...prev.projects.nanotechnology, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 15 ? { temporal_manipulation: { ...prev.projects.temporal_manipulation, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 16 ? { dimension_travel: { ...prev.projects.dimension_travel, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 17 ? { cosmic_energy: { ...prev.projects.cosmic_energy, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 18 ? { consciousness_upload: { ...prev.projects.consciousness_upload, unlocked: true } } : {}),
          ...((prev.trustLevel + 1) >= 19 ? { reality_shaping: { ...prev.projects.reality_shaping, unlocked: true } } : {})
        }
      }))
      addLog(`Trust level increased to ${state.trustLevel + 1}.`)
    }
  }, [state.energy, state.trustLevel, state.projects.generator_upgrade, state.projects.production_algorithms, state.projects.quantum_computing, state.projects.energy_mastery, state.projects.data_synthesis, state.projects.fusion_power, state.projects.matter_transmutation, state.projects.nanotechnology, state.projects.temporal_manipulation, state.projects.dimension_travel, state.projects.cosmic_energy, state.projects.consciousness_upload, state.projects.reality_shaping])
  
  // Prestigio
  const performPrestige = useCallback(() => {
    // Requisito: mínimo Trust Level 5 para poder prestigiar
    if (state.trustLevel < 5) {
      addLog('Cannot prestige: Need Trust Level 5+')
      setShowConfirmPrestige(false)
      return
    }

    // Calcular puntos de prestigio basado en múltiples factores
    const trustBonus = state.trustLevel * 2
    const energyBonus = Math.floor(state.stats.totalEnergyProduced / 10000)
    const generatorBonus = state.autoGenerators * 0.5
    const processorBonus = state.processors * 1
    const projectsBonus = state.stats.totalProjectsCompleted * 3

    // Puntos base: 5 + bonuses
    const prestigeGain = Math.floor(
      5 +
      trustBonus +
      energyBonus +
      generatorBonus +
      processorBonus +
      projectsBonus
    )

    // Multiplicador base: 1.05 + (5% por cada punto de prestigio)
    const multiplierBonus = 0.05 * prestigeGain
    const newMultiplier = 1 + multiplierBonus

    const initialState = getInitialState()

    // Calcular bonus de mejoras de prestigio
    const hasQuickStart = state.prestigeUpgrades.includes('start_funds')
    const hasQuickStartII = state.prestigeUpgrades.includes('start_funds_ii')
    const hasQuickStartIII = state.prestigeUpgrades.includes('start_funds_iii')
    const hasFreeGenerator = state.prestigeUpgrades.includes('auto_generators_1')
    const hasFreeGenerators5 = state.prestigeUpgrades.includes('auto_generators_5')
    const hasFreeGenerators10 = state.prestigeUpgrades.includes('auto_generators_10')
    const hasOpsMultiplier = state.prestigeUpgrades.includes('ops_multiplier')
    const hasOpsMultiplierII = state.prestigeUpgrades.includes('ops_multiplier_ii')
    const hasCostReduction = state.prestigeUpgrades.includes('cost_reduction')
    const hasCostReductionII = state.prestigeUpgrades.includes('cost_reduction_ii')
    const hasStorageBoost = state.prestigeUpgrades.includes('storage_boost')
    const hasStorageBoostII = state.prestigeUpgrades.includes('storage_boost_ii')
    const hasProductionBoost = state.prestigeUpgrades.includes('production_boost')
    const hasProductionBoostII = state.prestigeUpgrades.includes('production_boost_ii')
    const hasOfflineBonus = state.prestigeUpgrades.includes('offline_bonus')
    const hasOfflineBonusII = state.prestigeUpgrades.includes('offline_bonus_ii')
    const hasTrustBoost = state.prestigeUpgrades.includes('trust_boost')
    const hasDemandMaster = state.prestigeUpgrades.includes('demand_master')

    // Aplicar mejoras al estado inicial
    let startingFunds = 10
    let startingGenerators = 0
    let startingDemand = 10

    if (hasQuickStart) startingFunds += 1000
    if (hasQuickStartII) startingFunds += 5000
    if (hasQuickStartIII) startingFunds += 20000
    if (hasFreeGenerator) startingGenerators += 1
    if (hasFreeGenerators5) startingGenerators += 5
    if (hasFreeGenerators10) startingGenerators += 10
    if (hasDemandMaster) startingDemand += 10

    setState(prev => ({
      ...initialState,
      funds: startingFunds,
      autoGenerators: startingGenerators,
      demand: startingDemand,
      prestige: {
        count: prev.prestige.count + 1,
        multiplier: newMultiplier,
        bonusGenerators: prev.prestige.bonusGenerators + prestigeGain,
        points: prev.prestige.points + prestigeGain
      },
      prestigeUpgrades: prev.prestigeUpgrades, // Mantener mejoras
      stats: {
        ...initialState.stats,
        gameStartTime: Date.now(),
        lastSaveTime: Date.now(),
        prestigeCount: prev.prestige.count + 1
      }
    }))
    setShowConfirmPrestige(false)
    addLog(`Prestige! Gained ${prestigeGain} points (${prestigeGain * 0.05}% bonus)`)
  }, [state.trustLevel, state.stats, state.autoGenerators, state.processors, state.prestigeUpgrades])
  
  // Reset completo
  const fullReset = useCallback(() => {
    setState(getInitialState())
    setShowConfirmReset(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('energyCoreSave')
    }
    addLog('Game reset.')
  }, [])
  
  // Exportar partida
  const exportSave = useCallback(() => {
    const saveData = btoa(JSON.stringify(state))
    setImportCode(saveData)
    setShowExport(true)
  }, [state])

  // Descargar partida como archivo
  const downloadSave = useCallback(() => {
    try {
      const saveData = JSON.stringify(state, null, 2)
      const blob = new Blob([saveData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `energycore_save_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addLog('Save file downloaded.')
    } catch (e) {
      addLog('Failed to download save: ' + (e as Error).message)
    }
  }, [state])
  
  // Importar partida
  const importSave = useCallback(() => {
    try {
      const data = JSON.parse(atob(importCode))
      setState(data)
      setShowImport(false)
      addLog('Game imported successfully.')
    } catch (e) {
      addLog('Failed to import: Invalid save code.')
    }
  }, [importCode])
  
  // Calcular tiempo estimado para Singularity
  const estimatedTime = useMemo(() => {
    if (state.autoGenerators === 0) return null
    const opsPerSecond = state.processors * 10
    const currentProgress = state.projects.singularity?.progress || 0
    const required = state.projects.singularity?.required || 1000000
    const remaining = required - currentProgress
    const seconds = remaining / opsPerSecond
    return seconds
  }, [state.autoGenerators, state.processors, state.projects.singularity])

  // ===== SISTEMA DE PROGRESO OFFLINE =====
  useEffect(() => {
    if (typeof window === 'undefined') return

    const lastSave = state.stats.lastSaveTime
    const now = Date.now()
    const timeDiff = (now - lastSave) / 1000 // segundos

    if (!offlineProcessedRef.current && timeDiff > 10 && state.autoGenerators > 0) {
      offlineProcessedRef.current = true

      const productionPerSecond = state.autoGenerators * (1 + state.generatorLevel * 0.5) * state.prestige.multiplier
      const offlineProduction = productionPerSecond * timeDiff
      const offlineFunds = offlineProduction * (1 - (state.demand * 0.001))

      setTimeout(() => {
        setOfflineEarningsAmount(offlineFunds)
        setShowOfflineEarnings(true)

        setState(prev => ({
          ...prev,
          funds: prev.funds + offlineFunds,
          stats: {
            ...prev.stats,
            offlineEarnings: prev.stats.offlineEarnings + offlineFunds
          }
        }))

        addLog(`Offline earnings: ${formatMoney(offlineFunds)} (${formatTime(timeDiff)})`)
      }, 0)
    }
  }, []) // Solo ejecutar al montar

  // ===== SISTEMA DE TUTORIALES =====
  useEffect(() => {
    const triggerTutorial = () => {
      // Buscar el tutorial con mayor prioridad que no ha sido mostrado
      const availableTutorials = TUTORIALS.filter(t =>
        !state.tutorial.shown.includes(t.id) &&
        t.trigger(state)
      ).sort((a, b) => a.priority - b.priority)

      if (availableTutorials.length > 0 && !showTutorial) {
        const tutorial = availableTutorials[0]
        setCurrentTutorial(tutorial)
        setShowTutorial(true)
      }
    }

    const tutorialCheck = setInterval(triggerTutorial, 5000)
    return () => clearInterval(tutorialCheck)
  }, [state, showTutorial, state.tutorial.shown])

  const dismissTutorial = useCallback(() => {
    if (currentTutorial) {
      setState(prev => ({
        ...prev,
        tutorial: {
          ...prev.tutorial,
          shown: [...prev.tutorial.shown, currentTutorial.id],
          current: null
        }
      }))
      setShowTutorial(false)
      setCurrentTutorial(null)
    }
  }, [currentTutorial])

  // ===== SISTEMA DE INVESTIGACIÓN =====
  const getTechnologyMultiplier = useCallback((type: 'production' | 'cost' | 'ops' | 'storage'): number => {
    let multiplier = 1

    state.technologies.forEach(techId => {
      const tech = TECHNOLOGIES.find(t => t.id === techId)
      if (tech) {
        switch (techId) {
          case 'material_efficiency':
          case 'material_efficiency_ii':
          case 'material_efficiency_iii':
            if (type === 'cost') multiplier *= 0.9
            break
          case 'ops_boost':
            if (type === 'ops') multiplier *= 1.25
            break
          case 'ops_boost_ii':
            if (type === 'ops') multiplier *= 1.25
            break
          case 'ops_boost_iii':
            if (type === 'ops') multiplier *= 1.25
            break
          case 'storage_expansion_i':
            if (type === 'storage') multiplier *= 1.5
            break
          case 'storage_expansion_ii':
            if (type === 'storage') multiplier *= 1.5
            break
          case 'generator_boost':
            if (type === 'production') multiplier *= 1.2
            break
          case 'generator_boost_ii':
            if (type === 'production') multiplier *= 1.2
            break
          case 'generator_boost_iii':
            if (type === 'production') multiplier *= 1.2
            break
        }
      }
    })

    return multiplier
  }, [state.technologies])

  const researchTechnology = useCallback((techId: string) => {
    const tech = TECHNOLOGIES.find(t => t.id === techId)
    if (!tech) return

    if (state.ops >= tech.cost && !state.technologies.includes(techId)) {
      // Verificar requisitos
      const meetsRequirements = !tech.requires ||
        tech.requires.every(req => state.technologies.includes(req))

      if (meetsRequirements) {
        setState(prev => ({
          ...prev,
          ops: prev.ops - tech.cost,
          technologies: [...prev.technologies, techId]
        }))
        addLog(`Researched: ${tech.name}`)
      }
    }
  }, [state.ops, state.technologies])

  // ===== SISTEMA DE ALMACENAMIENTO =====
  const upgradeStorage = useCallback((type: 'materials' | 'ops' | 'creativity') => {
    const levels = state.storageLevels
    const level = levels[type]
    const baseCost = 100 * Math.pow(1.5, level)

    if (state.funds >= baseCost) {
      setState(prev => ({
        ...prev,
        funds: prev.funds - baseCost,
        storageLevels: {
          ...prev.storageLevels,
          [type]: level + 1
        }
      }))

      // Aplicar mejora de almacenamiento
      const storageMultiplier = getTechnologyMultiplier('storage')

      switch (type) {
        case 'materials':
          setState(prev => ({
            ...prev,
            maxMaterials: 1000 * (1 + (levels.materials + 1) * 0.5) * storageMultiplier
          }))
          break
        case 'ops':
          setState(prev => ({
            ...prev,
            maxOps: 100 * (1 + (levels.ops + 1) * 0.5) * storageMultiplier
          }))
          break
        case 'creativity':
          setState(prev => ({
            ...prev,
            maxCreativity: 100 * (1 + (levels.creativity + 1) * 0.5) * storageMultiplier
          }))
          break
      }

      addLog(`Upgraded ${type} storage to level ${level + 1}.`)
    }
  }, [state.funds, state.storageLevels, getTechnologyMultiplier])

  // ===== SISTEMA DE MEJORAS DE PRESTIGE =====
  const buyPrestigeUpgrade = useCallback((upgradeId: string) => {
    const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)
    if (!upgrade) return

    if (state.prestige.points >= upgrade.cost && !state.prestigeUpgrades.includes(upgradeId)) {
      setState(prev => ({
        ...prev,
        prestigeUpgrades: [...prev.prestigeUpgrades, upgradeId],
        prestige: {
          ...prev.prestige,
          points: prev.prestige.points - upgrade.cost
        }
      }))
      addLog(`Purchased prestige upgrade: ${upgrade.name}`)
    }
  }, [state.prestige.points, state.prestigeUpgrades])

  const getPrestigeMultiplier = useCallback((type: 'production' | 'cost' | 'ops' | 'storage'): number => {
    let multiplier = 1

    state.prestigeUpgrades.forEach(upgradeId => {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)
      if (upgrade && upgrade.appliesTo === type) {
        switch (upgradeId) {
          case 'production_boost':
            multiplier *= 1.25
            break
          case 'production_boost_ii':
            multiplier *= 1.5
            break
          case 'ops_multiplier':
            multiplier *= 1.5
            break
          case 'ops_multiplier_ii':
            multiplier *= 2
            break
          case 'cost_reduction':
            multiplier *= 0.85
            break
          case 'cost_reduction_ii':
            multiplier *= 0.75
            break
          case 'storage_boost':
            multiplier *= 2
            break
          case 'storage_boost_ii':
            multiplier *= 3
            break
          case 'offline_bonus':
          case 'offline_bonus_ii':
            if (type === 'ops') multiplier *= 2
            break
        }
      }
    })

    return multiplier
  }, [state.prestigeUpgrades])

  // ===== GUARDADO DE TIMESTAMP =====
  useEffect(() => {
    saveLoopRef.current = window.setInterval(() => {
      try {
        const saveState = {
          ...state,
          stats: {
            ...state.stats,
            lastSaveTime: Date.now()
          }
        }
        localStorage.setItem('energyCoreSave', JSON.stringify(saveState))
      } catch (e) {
        console.error('Failed to save:', e)
      }
    }, 30000)

    return () => clearInterval(saveLoopRef.current)
  }, [state])
  
  // Loop principal del juego
  useEffect(() => {
    gameLoopRef.current = window.setInterval(() => {
      // Producción automática
      if (state.autoGenerators > 0 && state.materials >= state.autoGenerators) {
        const production = state.autoGenerators * (1 + state.generatorLevel * 0.5) * state.prestige.multiplier
        const actualProduction = Math.min(production, state.materials)
        setState(prev => ({
          ...prev,
          materials: prev.materials - actualProduction,
          energy: prev.energy + actualProduction,
          unsoldEnergy: prev.unsoldEnergy + actualProduction,
          stats: {
            ...prev.stats,
            totalEnergyProduced: prev.stats.totalEnergyProduced + actualProduction
          }
        }))
      }
      
      // Generar trust
      generateTrust()
      
      // Generar Data desde Memory
      if (state.memory > 0 && state.data < state.maxCreativity) {
        setState(prev => ({
          ...prev,
          data: Math.min(prev.maxCreativity, prev.data + state.memory)
        }))
      }
      
      // Ajustar precio de materiales
      setState(prev => ({
        ...prev,
        materialCost: Math.max(5, Math.min(50, 5 + (state.demand * 0.1)))
      }))
      
    }, 1000)
    
    return () => clearInterval(gameLoopRef.current)
  }, [state.autoGenerators, state.generatorLevel, state.materials, state.memory, state.data, state.maxCreativity, state.demand, state.prestige.multiplier, generateTrust])
  
  // Loop de ops y creativity
  useEffect(() => {
    const interval = setInterval(() => {
      // Ops: 1 procesador genera 1 op cada 10 segundos (100 ticks de 100ms = 10 segundos)
      if (state.processors > 0 && state.ops < state.maxOps) {
        const opsGain = state.processors / 100
        setState(prev => ({
          ...prev,
          ops: Math.min(prev.maxOps, prev.ops + opsGain)
        }))
      }
      if (state.memory > 0 && state.creativity < state.maxCreativity) {
        setState(prev => ({
          ...prev,
          creativity: Math.min(prev.maxCreativity, prev.creativity + state.memory)
        }))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [state.processors, state.memory, state.maxOps, state.maxCreativity, state.ops, state.creativity])
  
  // Loop para historial de producción (cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      const productionRate = state.autoGenerators > 0 
        ? state.autoGenerators * (1 + state.generatorLevel * 0.5) * state.prestige.multiplier
        : 0
      setProductionHistory(prev => [...prev.slice(-11), productionRate])
    }, 5000)
    
    return () => clearInterval(interval)
  }, [state.autoGenerators, state.generatorLevel, state.prestige.multiplier])
  
  // Chequear completitud de proyectos
  useEffect(() => {
    Object.keys(state.projects).forEach(key => {
      const project = state.projects[key]
      if (project.progress >= project.required && !project.completed) {
        setState(prev => ({
          ...prev,
          projects: {
            ...prev.projects,
            [key]: { ...prev.projects[key], completed: true }
          },
          stats: {
            ...prev.stats,
            totalProjectsCompleted: prev.stats.totalProjectsCompleted + 1
          }
        }))
        
        // Efectos de proyectos
        switch (key) {
          case 'memory_unlock':
            addLog('Memory unlocked.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                marketing_unlock: { ...prev.projects.marketing_unlock, unlocked: true }
              }
            }))
            break
          case 'generator_upgrade':
            addLog('Generator efficiency improved.')
            setState(prev => ({
              ...prev,
              generatorLevel: prev.generatorLevel + 1,
              projects: {
                ...prev.projects,
                production_algorithms: { ...prev.projects.production_algorithms, unlocked: true }
              }
            }))
            break
          case 'production_algorithms':
            addLog('Production algorithms activated.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                quantum_computing: { ...prev.projects.quantum_computing, unlocked: true }
              }
            }))
            break
          case 'quantum_computing':
            addLog('Quantum computing achieved.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                space_exploration: { ...prev.projects.space_exploration, unlocked: true }
              }
            }))
            break
          case 'space_exploration':
            addLog('Space exploration initiated.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                fusion_power: { ...prev.projects.fusion_power, unlocked: true }
              }
            }))
            break
          case 'fusion_power':
            addLog('Fusion power mastered! Energy production doubled.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                nanotechnology: { ...prev.projects.nanotechnology, unlocked: true }
              }
            }))
            break
          case 'nanotechnology':
            addLog('Nanotechnology unlocked. Material costs reduced.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                dimension_travel: { ...prev.projects.dimension_travel, unlocked: true }
              }
            }))
            break
          case 'dimension_travel':
            addLog('Dimension travel achieved.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                consciousness_upload: { ...prev.projects.consciousness_upload, unlocked: true }
              }
            }))
            break
          case 'consciousness_upload':
            addLog('Consciousness upload complete. Ops generation tripled.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                cosmic_energy: { ...prev.projects.cosmic_energy, unlocked: true }
              }
            }))
            break
          case 'energy_mastery':
            addLog('Energy mastered!')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                data_synthesis: { ...prev.projects.data_synthesis, unlocked: true }
              }
            }))
            break
          case 'data_synthesis':
            addLog('Data synthesis achieved.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                matter_transmutation: { ...prev.projects.matter_transmutation, unlocked: true }
              }
            }))
            break
          case 'matter_transmutation':
            addLog('Matter transmutation unlocked.')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                temporal_manipulation: { ...prev.projects.temporal_manipulation, unlocked: true }
              }
            }))
            break
          case 'temporal_manipulation':
            addLog('Temporal manipulation achieved. Prestige multiplier increased!')
            setState(prev => ({
              ...prev,
              prestige: {
                ...prev.prestige,
                multiplier: prev.prestige.multiplier * 2
              },
              projects: {
                ...prev.projects,
                reality_shaping: { ...prev.projects.reality_shaping, unlocked: true }
              }
            }))
            break
          case 'cosmic_energy':
            addLog('Cosmic energy harvested!')
            setState(prev => ({
              ...prev,
              projects: {
                ...prev.projects,
                singularity: { ...prev.projects.singularity, unlocked: true }
              }
            }))
            break
          case 'reality_shaping':
            addLog('Reality shaping unlocked.')
            break
          case 'singularity':
            addLog('SINGULARITY ACHIEVED!')
            break
        }
      }
    })
  }, [state.projects])
  
  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case 'm':
          if (activeTab === 'manufacturing') {
            buyMaterials(false)
            e.preventDefault()
          }
          break
        case 'shift+m':
          if (activeTab === 'manufacturing') {
            buyMaterials(true)
            e.preventDefault()
          }
          break
        case 's':
          if (activeTab === 'business') {
            sellEnergy()
            e.preventDefault()
          }
          break
        case '1':
          setActiveTab('business')
          break
        case '2':
          setActiveTab('manufacturing')
          break
        case '3':
          setActiveTab('operations')
          break
        case '4':
          setActiveTab('projects')
          break
        case '5':
          setActiveTab('research')
          break
        case '6':
          setActiveTab('prestige')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeTab, buyMaterials, sellEnergy])

  // Calcular uptime (solo en cliente para evitar error de hidratación)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window === 'undefined') return

    const updateUptime = () => {
      const uptimeValue = Math.floor((Date.now() - state.stats.gameStartTime) / 1000)
      setUptime(uptimeValue)
    }

    const updatePrestigeCalculations = () => {
      const trustBonus = state.trustLevel * 2
      const energyBonus = Math.floor(state.stats.totalEnergyProduced / 10000)
      const generatorBonus = state.autoGenerators * 0.5
      const processorBonus = state.processors * 1
      const projectsBonus = state.stats.totalProjectsCompleted * 3
      const prestigeGain = Math.floor(5 + trustBonus + energyBonus + generatorBonus + processorBonus + projectsBonus)
      const newMultiplier = 1 + (0.05 * prestigeGain)

      setPrestigeCalculations({
        trustBonus,
        energyBonus,
        generatorBonus,
        processorBonus,
        projectsBonus,
        prestigeGain,
        newMultiplier
      })
    }

    updateUptime()
    updatePrestigeCalculations()

    const uptimeInterval = setInterval(updateUptime, 1000)
    const prestigeInterval = setInterval(updatePrestigeCalculations, 1000)

    return () => {
      clearInterval(uptimeInterval)
      clearInterval(prestigeInterval)
    }
  }, [state.stats.gameStartTime, state.trustLevel, state.stats.totalEnergyProduced, state.autoGenerators, state.processors, state.stats.totalProjectsCompleted])

  // Cálculos
  const generatorCost = Math.floor(50 * Math.pow(1.2, state.autoGenerators))
  const upgradeCost = Math.floor(500 * Math.pow(1.8, state.generatorLevel))
  const processorCost = Math.floor(500 * Math.pow(1.6, state.processors))
  const memoryCost = Math.floor(300 * Math.pow(1.5, state.memory))
  const marketingCost = Math.floor(500 * Math.pow(1.6, state.marketingLevel))

  const currentMultiplier = (state.prestige.multiplier).toFixed(2)
  const productionPerSecond = state.autoGenerators > 0
    ? state.autoGenerators * (1 + state.generatorLevel * 0.5) * state.prestige.multiplier
    : 0

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#000000',
      backgroundColor: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      margin: 0,
      padding: '5px'
    }}>
      {/* Header con recursos principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        padding: '8px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #000',
        marginBottom: '8px',
        fontSize: '11px'
      }}>
        <div><strong>Energy:</strong> {formatNumber(state.energy)}</div>
        <div><strong>Funds:</strong> {formatMoney(state.funds)}</div>
        <div><strong>Trust:</strong> {state.trust}/{state.trustLevel}</div>
        <div><strong>Prestige:</strong> {state.prestige.count} (x{currentMultiplier}, {state.prestige.points} pts)</div>
        <div><strong>Data:</strong> {formatNumber(state.data)}</div>
        <div><strong>Uptime:</strong> {formatTime(uptime)}</div>
      </div>

      {/* Tabs de navegación */}
      <div style={{
        display: 'flex',
        gap: '2px',
        marginBottom: '8px'
      }}>
        <button
          onClick={() => setActiveTab('business')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'business' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'business' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Business [1]
        </button>
        <button
          onClick={() => setActiveTab('manufacturing')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'manufacturing' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'manufacturing' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Manufacturing [2]
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'operations' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'operations' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Operations [3]
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'projects' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'projects' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Projects [4]
        </button>
        <button
          onClick={() => setActiveTab('research')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'research' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'research' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Research [5]
        </button>
        <button
          onClick={() => setActiveTab('prestige')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: activeTab === 'prestige' ? '#c0c0c0' : '#e0e0e0',
            border: activeTab === 'prestige' ? '1px solid #000' : '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Prestige Shop [6]
        </button>
        <button
          onClick={() => setShowExport(true)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: '#e0e0e0',
            border: '2px outset #ffffff',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Export
        </button>
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: '#e0e0e0',
            border: '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Import
        </button>
        <button
          onClick={() => setShowConfirmPrestige(true)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: '#e0e0e0',
            border: '2px outset #ffffff',
            cursor: 'pointer',
            color: state.trustLevel >= 10 ? '#006400' : '#000'
          }}
        >
          Prestige
        </button>
        <button
          onClick={() => setShowConfirmReset(true)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: '#ffcccc',
            border: '2px outset #ffffff',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>

      {/* Contenido principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Panel izquierdo - Contenido de tabs */}
        <div style={{
          border: '1px solid #000',
          padding: '8px',
          backgroundColor: '#f9f9f9',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeTab === 'business' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Business</h3>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Energy Available:</strong> {formatNumber(state.energy)}
                {' '}<span style={{ fontSize: '10px', color: '#666' }}>(unsold: {formatNumber(state.unsoldEnergy)})</span>
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Demand:</strong> {state.demand}%
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={makeEnergy}
                  disabled={state.materials < 1}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.materials >= 1 ? 'pointer' : 'not-allowed',
                    marginRight: '4px'
                  }}
                >
                  Make Energy
                </button>
                <button
                  onClick={sellEnergy}
                  disabled={state.unsoldEnergy <= 0}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.unsoldEnergy > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Sell Energy
                </button>
              </div>
            </div>
          )}
          
          
          {activeTab === 'manufacturing' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Manufacturing</h3>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Materials:</strong> {formatNumber(state.materials)}/{formatNumber(state.maxMaterials)}
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Cost:</strong> {formatMoney(state.materialCost)}/100
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => buyMaterials(false)}
                  disabled={state.funds < state.materialCost || state.materials >= state.maxMaterials}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= state.materialCost && state.materials < state.maxMaterials ? 'pointer' : 'not-allowed',
                    marginRight: '4px'
                  }}
                >
                  Buy [M]
                </button>
                <button
                  onClick={() => buyMaterials(true)}
                  disabled={state.funds < state.materialCost || state.materials >= state.maxMaterials}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= state.materialCost && state.materials < state.maxMaterials ? 'pointer' : 'not-allowed'
                  }}
                >
                  Max [Shift+M]
                </button>
              </div>
              
              <div style={{ marginTop: '12px', marginBottom: '6px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                <strong>Generators:</strong> {state.autoGenerators}
                {' '}<span style={{ fontSize: '10px', color: '#666' }}>(Level: {state.generatorLevel})</span>
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Production:</strong> {productionPerSecond.toFixed(1)}/s
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={buyGenerator}
                  disabled={state.funds < generatorCost || state.materials < 50}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= generatorCost && state.materials >= 50 ? 'pointer' : 'not-allowed',
                    marginRight: '4px'
                  }}
                >
                  Buy ({formatMoney(generatorCost)} + 50 mat)
                </button>
                <button
                  onClick={upgradeGenerator}
                  disabled={state.funds < upgradeCost}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= upgradeCost ? 'pointer' : 'not-allowed'
                  }}
                >
                  Upgrade ({formatMoney(upgradeCost)})
                </button>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>Storage Upgrades</h4>

                <div style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px' }}>
                      <strong>Materials Storage:</strong> Level {state.storageLevels.materials}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      {formatNumber(state.maxMaterials)} capacity
                    </span>
                  </div>
                  <button
                    onClick={() => upgradeStorage('materials')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: '#e0e0e0',
                      border: '2px outset #ffffff',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Upgrade ({formatMoney(100 * Math.pow(1.5, state.storageLevels.materials))})
                  </button>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px' }}>
                      <strong>Ops Storage:</strong> Level {state.storageLevels.ops}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      {formatNumber(state.maxOps)} capacity
                    </span>
                  </div>
                  <button
                    onClick={() => upgradeStorage('ops')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: '#e0e0e0',
                      border: '2px outset #ffffff',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Upgrade ({formatMoney(100 * Math.pow(1.5, state.storageLevels.ops))})
                  </button>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px' }}>
                      <strong>Creativity Storage:</strong> Level {state.storageLevels.creativity}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      {formatNumber(state.maxCreativity)} capacity
                    </span>
                  </div>
                  <button
                    onClick={() => upgradeStorage('creativity')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: '#e0e0e0',
                      border: '2px outset #ffffff',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Upgrade ({formatMoney(100 * Math.pow(1.5, state.storageLevels.creativity))})
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'operations' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Operations</h3>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Processors:</strong> {state.processors}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Ops Rate:</strong> {(state.processors / 10).toFixed(2)}/s
                {' '}<span style={{ fontSize: '10px', color: '#666' }}>({state.processors}/10s)</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Ops:</strong> {formatNumber(state.ops)}/{formatNumber(state.maxOps)}
                <div style={{ width: '100%', height: '12px', backgroundColor: '#e0e0e0', border: '1px solid #000', marginTop: '4px' }}>
                  <div style={{ 
                    width: `${(state.ops / state.maxOps) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#4CAF50' 
                  }}></div>
                </div>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={buyProcessor}
                  disabled={state.funds < processorCost}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= processorCost ? 'pointer' : 'not-allowed',
                    width: '100%'
                  }}
                >
                  Buy Processor ({formatMoney(processorCost)})
                </button>
              </div>
              
              <div style={{ marginTop: '12px', marginBottom: '6px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                <strong>Memory:</strong> {state.memory}
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <strong>Creativity:</strong> {formatNumber(state.creativity)}/{formatNumber(state.maxCreativity)}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Data Generated:</strong> {formatNumber(state.data)}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={buyMemory}
                  disabled={state.funds < memoryCost}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #ffffff',
                    cursor: state.funds >= memoryCost ? 'pointer' : 'not-allowed',
                    width: '100%'
                  }}
                >
                  Buy Memory ({formatMoney(memoryCost)})
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'projects' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Projects</h3>
              
              {Object.entries(state.projects)
                .filter(([_, project]) => project.unlocked)
                .map(([id, project]) => (
                  <div key={id} style={{
                    marginBottom: '8px',
                    padding: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                      {project.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px' }}>
                      {project.desc}
                    </div>
                    {project.completed ? (
                      <div style={{ fontSize: '10px', color: '#006400', fontWeight: 'bold' }}>
                        ✓ COMPLETED
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                          Progress: {project.progress} / {project.required}
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: '#e0e0e0', border: '1px solid #000', marginBottom: '4px' }}>
                          <div style={{ 
                            width: `${(project.progress / project.required) * 100}%`, 
                            height: '100%', 
                            backgroundColor: '#4CAF50' 
                          }}></div>
                        </div>
                        <button
                          onClick={() => workOnProject(id)}
                          disabled={state.ops < 1}
                          style={{
                            padding: '4px 10px',
                            fontSize: '10px',
                            backgroundColor: '#e0e0e0',
                            border: '2px outset #ffffff',
                            cursor: state.ops >= 1 ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Work (1 Ops)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              
              {state.projects.marketing_unlock.unlocked && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>Marketing</h4>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Level:</strong> {state.marketingLevel}
                  </div>
                  <button
                    onClick={buyMarketing}
                    disabled={state.funds < marketingCost}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      backgroundColor: '#e0e0e0',
                      border: '2px outset #ffffff',
                      cursor: state.funds >= marketingCost ? 'pointer' : 'not-allowed',
                      width: '100%'
                    }}
                  >
                    Increase Marketing ({formatMoney(marketingCost)})
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'research' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Research</h3>
              
              <div style={{ marginBottom: '8px', fontSize: '11px' }}>
                <strong>Available Ops:</strong> {formatNumber(state.ops)}
              </div>

              {TECHNOLOGIES.filter(tech => !state.technologies.includes(tech.id)).map(tech => {
                const canAfford = state.ops >= tech.cost
                const meetsRequirements = !tech.requires || tech.requires.every(req => state.technologies.includes(req))
                const canResearch = canAfford && meetsRequirements

                return (
                  <div key={tech.id} style={{
                    marginBottom: '8px',
                    padding: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: meetsRequirements ? '#fff' : '#f5f5f5'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                      {tech.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px' }}>
                      {tech.description}
                    </div>
                    <div style={{ fontSize: '10px', marginBottom: '4px', color: '#666' }}>
                      Effect: {tech.effect}
                    </div>
                    {tech.requires && tech.requires.length > 0 && (
                      <div style={{ fontSize: '9px', marginBottom: '4px', color: '#999' }}>
                        Requires: {tech.requires.map(r => {
                          const t = TECHNOLOGIES.find(tech => tech.id === r)
                          return t ? t.name : r
                        }).join(', ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px' }}>
                        Cost: <strong>{formatNumber(tech.cost)} Ops</strong>
                      </span>
                      <button
                        onClick={() => researchTechnology(tech.id)}
                        disabled={!canResearch}
                        style={{
                          padding: '4px 12px',
                          fontSize: '10px',
                          backgroundColor: canResearch ? '#e0e0e0' : '#cccccc',
                          border: '2px outset #ffffff',
                          cursor: canResearch ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Research
                      </button>
                    </div>
                  </div>
                )
              })}

              {state.technologies.length > 0 && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>
                    Researched Technologies ({state.technologies.length}/{TECHNOLOGIES.length})
                  </h4>
                  <div style={{ fontSize: '10px' }}>
                    {state.technologies.map(techId => {
                      const tech = TECHNOLOGIES.find(t => t.id === techId)
                      return tech ? (
                        <div key={techId} style={{ marginBottom: '2px', color: '#006400' }}>
                          ✓ {tech.name}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prestige' && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Prestige Shop</h3>
              
              <div style={{ marginBottom: '8px', padding: '6px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                <strong>Available Points:</strong> {formatNumber(state.prestige.points)}
                <br />
                <span style={{ fontSize: '10px', color: '#666' }}>
                  Gain prestige points by reaching Trust Level 5+ and prestiging. Points are based on your progress! Can reach up to Level 20.
                </span>
              </div>

              {PRESTIGE_UPGRADES.map(upgrade => {
                const owned = state.prestigeUpgrades.includes(upgrade.id)
                const canAfford = state.prestige.points >= upgrade.cost

                return (
                  <div key={upgrade.id} style={{
                    marginBottom: '8px',
                    padding: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: owned ? '#f0fff0' : '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                          {upgrade.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px' }}>
                          {upgrade.description}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          Effect: {upgrade.effect}
                        </div>
                      </div>
                      {owned ? (
                        <div style={{
                          padding: '4px 12px',
                          backgroundColor: '#4CAF50',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          OWNED
                        </div>
                      ) : (
                        <button
                          onClick={() => buyPrestigeUpgrade(upgrade.id)}
                          disabled={!canAfford}
                          style={{
                            padding: '4px 12px',
                            fontSize: '10px',
                            backgroundColor: canAfford ? '#e0e0e0' : '#cccccc',
                            border: '2px outset #ffffff',
                            cursor: canAfford ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {formatNumber(upgrade.cost)} pts
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel central - Estadísticas */}
        <div style={{
          border: '1px solid #000',
          padding: '8px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Statistics</h3>
          
          <div style={{ marginBottom: '6px' }}>
            <strong>Total Energy:</strong> {formatNumber(state.stats.totalEnergyProduced)}
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <strong>Total Funds:</strong> {formatMoney(state.stats.totalFundsEarned)}
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <strong>Materials Bought:</strong> {formatNumber(state.stats.totalMaterialsPurchased)}
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <strong>Projects Done:</strong> {state.stats.totalProjectsCompleted}
          </div>
          
          {estimatedTime && (
            <div style={{ marginTop: '8px', marginBottom: '6px', padding: '6px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
              <strong>Est. to Singularity:</strong> {formatTime(estimatedTime)}
            </div>
          )}
          
          <div style={{ marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>Production History</h4>
            <div style={{ fontSize: '10px', fontFamily: 'Courier New, monospace' }}>
              {productionHistory.map((rate, i) => (
                <div key={i}>{rate.toFixed(1)}/s</div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho - Logros y Log */}
        <div style={{
          border: '1px solid #000',
          padding: '8px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Achievements</h3>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '8px',
            border: '1px solid #ccc',
            padding: '6px',
            backgroundColor: '#fff'
          }}>
            {ACHIEVEMENTS.map(ach => (
              <div key={ach.id} style={{
                marginBottom: '4px',
                fontSize: '10px',
                color: state.achievements.includes(ach.id) ? '#006400' : '#999',
                fontWeight: state.achievements.includes(ach.id) ? 'bold' : 'normal'
              }}>
                {state.achievements.includes(ach.id) ? '✓ ' : '○ '}{ach.name}
                <div style={{ fontSize: '9px', color: '#666' }}>{ach.description}</div>
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: '1px solid #ccc', paddingTop: '6px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>System Log</h4>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '9px',
              lineHeight: '1.3',
              backgroundColor: '#f5f5f5',
              padding: '6px',
              border: '1px solid #ccc',
              height: '120px',
              overflowY: 'auto'
            }}>
              {log.map((entry, i) => (
                <div key={i}>{entry}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showExport && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Export Save</h3>
          <p style={{ fontSize: '11px', marginBottom: '12px' }}>
            Copy this code to save your game:
          </p>
          <textarea
            readOnly
            value={importCode}
            style={{
              width: '400px',
              height: '100px',
              fontFamily: 'Courier New, monospace',
              fontSize: '10px',
              marginBottom: '12px'
            }}
          />
          <div>
            <button
              onClick={downloadSave}
              style={{
                padding: '6px 16px',
                backgroundColor: '#4CAF50',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                marginRight: '8px',
                color: '#fff'
              }}
            >
              Download File
            </button>
            <button
              onClick={() => setShowExport(false)}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {showImport && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Import Save</h3>
          <p style={{ fontSize: '11px', marginBottom: '12px' }}>
            Paste your save code below:
          </p>
          <textarea
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            style={{
              width: '400px',
              height: '100px',
              fontFamily: 'Courier New, monospace',
              fontSize: '10px',
              marginBottom: '12px'
            }}
          />
          <div>
            <button
              onClick={importSave}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Import
            </button>
            <button
              onClick={() => setShowImport(false)}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {showConfirmReset && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#cc0000' }}>Reset Game?</h3>
          <p style={{ fontSize: '11px', marginBottom: '12px' }}>
            This will delete all progress. Are you sure?
          </p>
          <div>
            <button
              onClick={fullReset}
              style={{
                padding: '6px 16px',
                backgroundColor: '#cc0000',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                color: '#fff',
                marginRight: '8px'
              }}
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {showConfirmPrestige && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#006400' }}>Prestige?</h3>
          <p style={{ fontSize: '11px', marginBottom: '8px' }}>
            You will reset your progress but gain permanent bonuses:
          </p>

          {state.trustLevel < 5 ? (
            <div style={{
              padding: '8px',
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              marginBottom: '12px',
              fontSize: '10px'
            }}>
              <strong>⚠️ Requirements not met!</strong><br />
              You need Trust Level 5+ to prestige.<br />
              Current: {state.trustLevel}/10
            </div>
          ) : (
            isMounted ? (
              <div style={{ fontSize: '11px', marginBottom: '12px', padding: '8px', backgroundColor: '#f0fff0', border: '1px solid #4CAF50' }}>
                <strong>+{prestigeCalculations.prestigeGain} Prestige Points</strong><br />
                <strong>New Multiplier: x{prestigeCalculations.newMultiplier.toFixed(2)}</strong><br />
                <strong>Current: x{currentMultiplier}</strong><br />
                <div style={{ marginTop: '6px', fontSize: '10px', borderTop: '1px solid #4CAF50', paddingTop: '4px' }}>
                  <strong>Bonuses:</strong><br />
                  • Trust ({state.trustLevel}): +{prestigeCalculations.trustBonus}<br />
                  • Energy: +{prestigeCalculations.energyBonus}<br />
                  • Generators: +{prestigeCalculations.generatorBonus.toFixed(1)}<br />
                  • Processors: +{prestigeCalculations.processorBonus}<br />
                  • Projects: +{prestigeCalculations.projectsBonus}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '11px', marginBottom: '12px', padding: '8px', backgroundColor: '#f0fff0', border: '1px solid #4CAF50' }}>
                Calculating...
              </div>
            )
          )}
          <div>
            <button
              onClick={performPrestige}
              disabled={state.trustLevel < 5}
              style={{
                padding: '6px 16px',
                backgroundColor: state.trustLevel >= 5 ? '#4CAF50' : '#cccccc',
                border: '2px outset #ffffff',
                cursor: state.trustLevel >= 5 ? 'pointer' : 'not-allowed',
                color: '#fff',
                marginRight: '8px'
              }}
            >
              Prestige!
            </button>
            <button
              onClick={() => setShowConfirmPrestige(false)}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ganancias Offline */}
      {showOfflineEarnings && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '400px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#006400' }}>Welcome Back!</h3>
          <p style={{ fontSize: '11px', marginBottom: '12px' }}>
            While you were away, your energy core continued operating:
          </p>
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fff0',
            border: '1px solid #4CAF50',
            marginBottom: '12px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#006400'
          }}>
            +{formatMoney(offlineEarningsAmount)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowOfflineEarnings(false)}
              style={{
                padding: '6px 24px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Collect
            </button>
          </div>
        </div>
      )}

      {/* Modal de Tutorial */}
      {showTutorial && currentTutorial && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          border: '2px solid #000',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '450px'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>{currentTutorial.title}</h3>
          <p style={{ fontSize: '11px', marginBottom: '16px', lineHeight: '1.5' }}>
            {currentTutorial.message}
          </p>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={dismissTutorial}
              style={{
                padding: '6px 16px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #ffffff',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
