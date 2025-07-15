import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Progress } from './components/ui/progress'
import { Badge } from './components/ui/badge'
import { GameMenu } from './components/GameMenu'
import { blink } from './blink/client'
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Target, 
  MapPin,
  Ghost,
  Skull,
  ArrowRight,
  ArrowLeft,
  Crosshair,
  Flame,
  Snowflake,
  User,
  Crown,
  Star,
  Activity,
  Eye,
  Sparkles,
  Clock,
  Menu,
  Coins
} from 'lucide-react'

type GamePage = 'hunters' | 'equipment' | 'location' | 'combat'

interface Hunter {
  id: string
  name: string
  class: string
  health: number
  maxHealth: number
  specialAbility: string
  description: string
  icon: React.ReactNode
  speed: number
  critChance: number
  image: string
  level: number
  xp: number
  ectos: number
}

interface Equipment {
  id: string
  name: string
  type: 'weapon' | 'shield'
  damage?: number
  defense?: number
  special?: string
  icon: React.ReactNode
  critMultiplier?: number
  speed?: number
}

interface Location {
  id: string
  name: string
  difficulty: number
  description: string
  ghostTypes: string[]
  icon: React.ReactNode
}

interface GameGhost {
  id: string
  name: string
  health: number
  maxHealth: number
  damage: number
  position: { x: number; y: number }
  attacking: boolean
  stunned: boolean
  movePattern: 'aggressive' | 'defensive' | 'erratic'
  abilities: string[]
  inCombat: boolean
  targetingHunter: boolean
}

interface DamageNumber {
  id: string
  damage: number
  x: number
  y: number
  critical: boolean
  type: 'damage' | 'heal' | 'shield'
}

interface Material {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description: string
  quantity: number
  sourceGhost: string
}

interface BestiaryEntry {
  id: string
  ghostName: string
  timesEncountered: number
  timesDefeated: number
  location: string
  discoveredAt: string
  lastEncounter: string
}

interface Skill {
  id: string
  name: string
  type: 'combat' | 'survival' | 'occult'
  level: number
  maxLevel: number
  description: string
  unlocked: boolean
}

interface CraftingRecipe {
  id: string
  itemName: string
  itemType: 'weapon' | 'shield' | 'armor'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  requiredMaterials: Record<string, number>
  stats: Record<string, any>
  description: string
}

function App() {
  const [currentPage, setCurrentPage] = useState<GamePage>('hunters')
  const [selectedHunter, setSelectedHunter] = useState<Hunter | null>(null)
  const [selectedWeapon, setSelectedWeapon] = useState<Equipment | null>(null)
  const [selectedShield, setSelectedShield] = useState<Equipment | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [bestiary, setBestiary] = useState<BestiaryEntry[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [craftingRecipes, setCraftingRecipes] = useState<CraftingRecipe[]>([])
  
  // Combat state
  const [hunterHealth, setHunterHealth] = useState(100)
  const [hunterShield, setHunterShield] = useState(100)
  const [hunterPosition, setHunterPosition] = useState({ x: 20, y: 50 })
  const [hunterXP, setHunterXP] = useState(0)
  const [hunterLevel, setHunterLevel] = useState(1)
  const [hunterEctos, setHunterEctos] = useState(0)
  const [ghostsKilled, setGhostsKilled] = useState(0)
  const [activeGhosts, setActiveGhosts] = useState<GameGhost[]>([])
  const [nextGhostId, setNextGhostId] = useState(1)
  const [spawnTimer, setSpawnTimer] = useState<NodeJS.Timeout | null>(null)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [victory, setVictory] = useState(false)
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([])
  const [playerEnergy, setPlayerEnergy] = useState(100)
  const [ghostMoving, setGhostMoving] = useState(false)
  const [combatEffects, setCombatEffects] = useState<string[]>([])
  const [hunterInRecovery, setHunterInRecovery] = useState(false)
  const [recoveryTimeLeft, setRecoveryTimeLeft] = useState(0)
  const [currentCombatGhost, setCurrentCombatGhost] = useState<string | null>(null)
  
  const combatAreaRef = useRef<HTMLDivElement>(null)

  // Initialize auth and data
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadGameData()
      }
    })
    return unsubscribe
  }, [loadGameData])

  const loadGameData = useCallback(async () => {
    try {
      // Load materials
      const materialsData = await blink.db.materials.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setMaterials(materialsData.map((m: any) => ({
        id: m.id,
        name: m.name,
        rarity: m.rarity,
        description: m.description,
        quantity: m.quantity,
        sourceGhost: m.sourceGhost || m.source_ghost
      })))

      // Load equipment
      const equipmentData = await blink.db.equipment.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setEquipment(equipmentData.map((e: any) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        rarity: e.rarity,
        damage: e.damage,
        defense: e.defense,
        special: e.special,
        crafted: Number(e.crafted) > 0,
        equipped: Number(e.equipped) > 0
      })))

      // Load bestiary
      const bestiaryData = await blink.db.bestiary.list({
        where: { userId: user?.id },
        orderBy: { lastEncounter: 'desc' }
      })
      setBestiary(bestiaryData.map((b: any) => ({
        id: b.id,
        ghostName: b.ghostName || b.ghost_name,
        timesEncountered: b.timesEncountered || b.times_encountered,
        timesDefeated: b.timesDefeated || b.times_defeated,
        location: b.location,
        discoveredAt: b.discoveredAt || b.discovered_at,
        lastEncounter: b.lastEncounter || b.last_encounter
      })))

      // Load skills
      const skillsData = await blink.db.skillTree.list({
        where: { userId: user?.id },
        orderBy: { skillType: 'asc' }
      })
      if (skillsData.length === 0) {
        // Initialize default skills for new user
        await initializeDefaultSkills()
      } else {
        setSkills(skillsData.map((s: any) => ({
          id: s.id,
          name: s.skillName || s.skill_name,
          type: s.skillType || s.skill_type,
          level: s.level,
          maxLevel: s.maxLevel || s.max_level,
          description: s.description,
          unlocked: Number(s.unlocked) > 0
        })))
      }

      // Load crafting recipes
      const recipesData = await blink.db.craftingRecipes.list({
        orderBy: { rarity: 'asc' }
      })
      setCraftingRecipes(recipesData.map((r: any) => ({
        id: r.id,
        itemName: r.itemName || r.item_name,
        itemType: r.itemType || r.item_type,
        rarity: r.rarity,
        requiredMaterials: JSON.parse(r.requiredMaterials || r.required_materials || '{}'),
        stats: JSON.parse(r.stats || '{}'),
        description: r.description
      })))

    } catch (error) {
      console.error('Error loading game data:', error)
    }
  }, [user?.id])

  const initializeDefaultSkills = async () => {
    const defaultSkills = [
      { id: 'combat_mastery', name: 'Combat Mastery', type: 'combat', level: 0, maxLevel: 5, description: 'Increases damage by 10% per level', unlocked: true },
      { id: 'critical_strike', name: 'Critical Strike', type: 'combat', level: 0, maxLevel: 5, description: 'Increases critical hit chance by 5% per level', unlocked: false },
      { id: 'defensive_stance', name: 'Defensive Stance', type: 'combat', level: 0, maxLevel: 3, description: 'Reduces damage taken by 15% per level', unlocked: false },
      { id: 'ghost_sight', name: 'Ghost Sight', type: 'occult', level: 0, maxLevel: 3, description: 'Reveals ghost weaknesses and increases XP gain', unlocked: true },
      { id: 'ectoplasm_mastery', name: 'Ectoplasm Mastery', type: 'occult', level: 0, maxLevel: 5, description: 'Increases ecto drops by 20% per level', unlocked: false },
      { id: 'spirit_communion', name: 'Spirit Communion', type: 'occult', level: 0, maxLevel: 3, description: 'Chance to avoid combat through negotiation', unlocked: false },
      { id: 'survival_instinct', name: 'Survival Instinct', type: 'survival', level: 0, maxLevel: 5, description: 'Increases health by 20 per level', unlocked: true },
      { id: 'energy_conservation', name: 'Energy Conservation', type: 'survival', level: 0, maxLevel: 3, description: 'Reduces energy consumption by 25% per level', unlocked: false },
      { id: 'rapid_recovery', name: 'Rapid Recovery', type: 'survival', level: 0, maxLevel: 3, description: 'Reduces recovery time by 30 seconds per level', unlocked: false }
    ]

    for (const skill of defaultSkills) {
      await blink.db.skillTree.create({
        id: `${user?.id}_${skill.id}`,
        userId: user?.id,
        skillName: skill.name,
        skillType: skill.type,
        level: skill.level,
        maxLevel: skill.maxLevel,
        description: skill.description,
        unlocked: skill.unlocked
      })
    }
    
    await loadGameData()
  }

  // Static data arrays
  const hunters: Hunter[] = [
    {
      id: 'warrior',
      name: '"Father Dave" Langford',
      class: 'Exorcist',
      health: 120,
      maxHealth: 120,
      specialAbility: 'Divine Banishment',
      description: 'A battle-hardened priest with superior combat skills and divine protection against supernatural entities.',
      icon: <Sword className="w-8 h-8" />,
      speed: 15,
      critChance: 20,
      image: 'https://images.unsplash.com/photo-1698685403041-15246d705516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxwcmllc3QlMjBleG9yY2lzdCUyMGRhcmslMjBwb3J0cmFpdCUyMGdvdGhpY3xlbnwwfDF8fHwxNzUyNTcxOTg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      level: hunterLevel,
      xp: hunterXP,
      ectos: 0
    },
    {
      id: 'mage',
      name: 'The Blacklisted Inquisitor',
      class: 'Occultist',
      health: 80,
      maxHealth: 80,
      specialAbility: 'Forbidden Knowledge',
      description: 'A mysterious occultist who deals massive magical damage using forbidden arts and ancient rituals.',
      icon: <Zap className="w-8 h-8" />,
      speed: 25,
      critChance: 30,
      image: 'https://images.unsplash.com/photo-1666705514317-2afb0df7b798?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxvY2N1bHRpc3QlMjBkYXJrJTIwbXlzdGVyaW91cyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTI1NzE5OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      level: hunterLevel,
      xp: hunterXP,
      ectos: 0
    },
    {
      id: 'paladin',
      name: 'Vega "Overclock" Rook',
      class: 'Tech Specialist',
      health: 100,
      maxHealth: 100,
      specialAbility: 'Spectral Override',
      description: 'A tech specialist who uses advanced spectral technology and digital warfare against supernatural threats.',
      icon: <Crown className="w-8 h-8" />,
      speed: 10,
      critChance: 15,
      image: 'https://images.unsplash.com/photo-1580046939256-c377c5b099f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwc3BlY2lhbGlzdCUyMGN5YmVycHVuayUyMGhhY2tlciUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTI1NzE5OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      level: hunterLevel,
      xp: hunterXP,
      ectos: 0
    }
  ]

  const weapons: Equipment[] = [
    {
      id: 'sword',
      name: 'Spectral Blade',
      type: 'weapon',
      damage: 25,
      special: 'Ignores ghost armor',
      icon: <Sword className="w-6 h-6" />,
      critMultiplier: 2.0,
      speed: 10
    },
    {
      id: 'staff',
      name: 'Ethereal Staff',
      type: 'weapon',
      damage: 35,
      special: 'Magic damage bonus',
      icon: <Zap className="w-6 h-6" />,
      critMultiplier: 2.5,
      speed: 15
    },
    {
      id: 'crossbow',
      name: 'Spirit Crossbow',
      type: 'weapon',
      damage: 30,
      special: 'Long range attacks',
      icon: <Crosshair className="w-6 h-6" />,
      critMultiplier: 3.0,
      speed: 5
    }
  ]

  const shields: Equipment[] = [
    {
      id: 'tower',
      name: 'Tower Shield',
      type: 'shield',
      defense: 20,
      special: 'High physical defense',
      icon: <Shield className="w-6 h-6" />
    },
    {
      id: 'mystic',
      name: 'Mystic Ward',
      type: 'shield',
      defense: 15,
      special: 'Magic resistance',
      icon: <Star className="w-6 h-6" />
    },
    {
      id: 'buckler',
      name: 'Spirit Buckler',
      type: 'shield',
      defense: 10,
      special: 'Fast counterattacks',
      icon: <Target className="w-6 h-6" />
    }
  ]

  const locations: Location[] = [
    {
      id: 'mansion',
      name: 'Haunted Mansion',
      difficulty: 1,
      description: 'An old Victorian mansion with restless spirits.',
      ghostTypes: ['Poltergeist', 'Spirit'],
      icon: <Skull className="w-6 h-6" />
    },
    {
      id: 'cemetery',
      name: 'Cursed Cemetery',
      difficulty: 2,
      description: 'Ancient burial ground with powerful undead.',
      ghostTypes: ['Wraith', 'Banshee'],
      icon: <Ghost className="w-6 h-6" />
    },
    {
      id: 'hospital',
      name: 'Abandoned Hospital',
      difficulty: 3,
      description: 'A medical facility haunted by tormented souls.',
      ghostTypes: ['Phantom', 'Shadow'],
      icon: <Heart className="w-6 h-6" />
    }
  ]

  // Calculate XP needed for next level
  const getXPForLevel = useCallback((level: number) => level * 50, [])

  const addDamageNumber = useCallback((damage: number, critical: boolean = false, type: 'damage' | 'heal' | 'shield' = 'damage') => {
    const newDamage: DamageNumber = {
      id: Date.now().toString(),
      damage,
      x: Math.random() * 60 + 20,
      y: Math.random() * 40 + 30,
      critical,
      type
    }
    
    setDamageNumbers(prev => [...prev, newDamage])
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== newDamage.id))
    }, 2000)
  }, [])

  const addCombatEffect = useCallback((effect: string) => {
    setCombatEffects(prev => [...prev, effect])
    setTimeout(() => {
      setCombatEffects(prev => prev.slice(1))
    }, 2000)
  }, [])

  // Hunter wins combat
  const hunterVictory = useCallback((ghostId: string) => {
    setActiveGhosts(currentGhosts => {
      const ghost = currentGhosts.find(g => g.id === ghostId)
      if (!ghost) return currentGhosts
      
      setCombatLog(prev => [...prev, `🏆 You defeated ${ghost.name}! The ghost disappears into the void.`])
      addCombatEffect('VICTORY!')
      addDamageNumber(50, true)
      
      setCurrentCombatGhost(null)
      setGhostsKilled(prev => prev + 1)
      
      // Award XP
      const xpGained = 35 + (selectedLocation?.difficulty || 1) * 15
      setHunterXP(prev => {
        const newXP = prev + xpGained
        const xpNeeded = getXPForLevel(hunterLevel)
        if (newXP >= xpNeeded) {
          setHunterLevel(prevLevel => prevLevel + 1)
          setCombatLog(prevLog => [...prevLog, `🌟 Level up! You are now level ${hunterLevel + 1}!`])
          addCombatEffect('LEVEL UP!')
          return newXP - xpNeeded
        }
        return newXP
      })
      
      // Restore some energy and health
      setPlayerEnergy(prev => Math.min(100, prev + 20))
      setHunterHealth(prev => Math.min(selectedHunter?.maxHealth || 100, prev + 10))
      
      // Remove defeated ghost
      return currentGhosts.filter(g => g.id !== ghostId)
    })
  }, [selectedLocation, hunterLevel, selectedHunter, addCombatEffect, addDamageNumber, getXPForLevel])

  // Ghost wins combat
  const ghostVictory = useCallback((ghostId: string) => {
    setActiveGhosts(currentGhosts => {
      const ghost = currentGhosts.find(g => g.id === ghostId)
      if (!ghost) return currentGhosts
      
      setCombatLog(prev => [...prev, `💀 ${ghost.name} defeated you! Entering recovery mode...`])
      addCombatEffect('DEFEATED!')
      addDamageNumber(100, false, 'damage')
      
      // Start recovery mode (3 minutes = 180 seconds)
      setHunterInRecovery(true)
      setRecoveryTimeLeft(180)
      setHunterHealth(0)
      setHunterShield(0)
      setPlayerEnergy(0)
      setCurrentCombatGhost(null)
      
      setCombatLog(prev => [...prev, '🏥 Recovery mode activated. You will be restored in 3 minutes.'])
      
      // Ghost disappears after defeating hunter
      return currentGhosts.filter(g => g.id !== ghostId)
    })
  }, [addCombatEffect, addDamageNumber])

  // Initiate combat between hunter and ghost
  const initiateCombat = useCallback((ghostId: string) => {
    setActiveGhosts(currentGhosts => {
      const ghost = currentGhosts.find(g => g.id === ghostId)
      if (!ghost || hunterInRecovery) return currentGhosts
      
      setCombatLog(prev => [...prev, `🥊 Combat initiated with ${ghost.name}!`])
      
      // Determine combat outcome (50/50 chance for now, can be modified based on stats)
      const hunterWins = Math.random() > 0.4 // Slightly favor hunter
      
      setTimeout(() => {
        if (hunterWins) {
          hunterVictory(ghostId)
        } else {
          ghostVictory(ghostId)
        }
      }, 2000)
      
      return currentGhosts
    })
  }, [hunterInRecovery, hunterVictory, ghostVictory])

  // Start ghost confrontation
  const startGhostConfrontation = useCallback((ghostId: string) => {
    if (hunterInRecovery) return
    
    setActiveGhosts(prev => prev.map(ghost => {
      if (ghost.id === ghostId) {
        return {
          ...ghost,
          targetingHunter: true,
          inCombat: true
        }
      }
      return ghost
    }))
    
    setCurrentCombatGhost(ghostId)
    
    setActiveGhosts(currentGhosts => {
      const ghost = currentGhosts.find(g => g.id === ghostId)
      if (ghost) {
        setCombatLog(prev => [...prev, `⚔️ ${ghost.name} confronts you! Combat begins!`])
        addCombatEffect('COMBAT ENGAGED!')
        
        // Start combat after brief delay
        setTimeout(() => {
          if (!hunterInRecovery) {
            initiateCombat(ghostId)
          }
        }, 1500)
      }
      return currentGhosts
    })
  }, [hunterInRecovery, addCombatEffect, initiateCombat])

  // Initialize combat when entering combat page
  useEffect(() => {
    if (currentPage === 'combat' && selectedLocation && activeGhosts.length === 0 && !hunterInRecovery) {
      const ghostTypes = ['Vengeful Spirit', 'Dark Wraith', 'Phantom Lord', 'Shadow Demon', 'Cursed Soul']
      
      const spawnGhost = () => {
        if (hunterInRecovery) return // Don't spawn ghosts during recovery
        
        const randomGhost = ghostTypes[Math.floor(Math.random() * ghostTypes.length)]
        const baseHealth = 60 + (selectedLocation.difficulty * 20)
        const movePatterns: ('aggressive' | 'defensive' | 'erratic')[] = ['aggressive', 'defensive', 'erratic']
        
        const newGhost: GameGhost = {
          id: nextGhostId.toString(),
          name: randomGhost,
          health: baseHealth,
          maxHealth: baseHealth,
          damage: 15 + (selectedLocation.difficulty * 5),
          position: { x: 95, y: Math.random() * 60 + 20 }, // Spawn from right side
          attacking: false,
          stunned: false,
          movePattern: movePatterns[Math.floor(Math.random() * movePatterns.length)],
          abilities: ['Phase Strike', 'Soul Drain', 'Spectral Charge'],
          inCombat: false,
          targetingHunter: false
        }
        
        setActiveGhosts(prev => [...prev, newGhost])
        setNextGhostId(prev => prev + 1)
        setCombatLog(prev => [...prev, `👻 A ${randomGhost} materializes from the ethereal plane!`])
        
        // Start confrontation after 2 seconds
        setTimeout(() => {
          startGhostConfrontation(newGhost.id)
        }, 2000)
      }
      
      // Spawn first ghost immediately
      spawnGhost()
      
      if (selectedHunter) {
        setHunterHealth(selectedHunter.health)
        setHunterShield(100)
        setHunterPosition({ x: 20, y: 50 })
      }
      
      setIsPlayerTurn(true)
      setGameOver(false)
      setVictory(false)
      setPlayerEnergy(100)
      setDamageNumbers([])
      setCombatEffects([])
      setHunterXP(0)
      setHunterLevel(1)
      setGhostsKilled(0)
      setHunterInRecovery(false)
      setRecoveryTimeLeft(0)
      setCurrentCombatGhost(null)
      
      // Set up continuous spawning every 15 seconds
      const timer = setInterval(() => {
        setActiveGhosts(currentGhosts => {
          if (!gameOver && !hunterInRecovery && currentGhosts.length < 2) { // Max 2 ghosts at once
            spawnGhost()
          }
          return currentGhosts
        })
      }, 15000) // 15 seconds
      
      setSpawnTimer(timer)
    }
    
    return () => {
      if (spawnTimer) {
        clearInterval(spawnTimer)
      }
    }
  }, [currentPage, selectedLocation, selectedHunter, activeGhosts.length, hunterInRecovery, nextGhostId, startGhostConfrontation, gameOver, spawnTimer])

  // Recovery timer
  useEffect(() => {
    let recoveryTimer: NodeJS.Timeout
    
    if (hunterInRecovery && recoveryTimeLeft > 0) {
      recoveryTimer = setTimeout(() => {
        setRecoveryTimeLeft(prev => {
          if (prev <= 1) {
            // Recovery complete
            setHunterInRecovery(false)
            if (selectedHunter) {
              setHunterHealth(selectedHunter.maxHealth)
              setHunterShield(100)
              setPlayerEnergy(100)
            }
            setCombatLog(prev => [...prev, '💚 Recovery complete! You are ready to fight again!'])
            addCombatEffect('RECOVERY COMPLETE!')
            
            // Remove all ghosts when recovery is complete
            setActiveGhosts([])
            setCurrentCombatGhost(null)
            
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer)
      }
    }
  }, [hunterInRecovery, recoveryTimeLeft, selectedHunter, addCombatEffect])

  // Ghost AI movement - updated to handle confrontation
  useEffect(() => {
    if (!activeGhosts.length || gameOver || hunterInRecovery) return

    const moveGhost = (ghost: GameGhost) => {
      if (ghost.inCombat) return // Don't move ghosts in combat
      
      setGhostMoving(true)
      
      setTimeout(() => {
        setActiveGhosts(prev => {
          const index = prev.findIndex(g => g.id === ghost.id)
          if (index === -1) return prev
          
          let newX = prev[index].position.x
          let newY = prev[index].position.y
          
          if (prev[index].targetingHunter) {
            // Move towards hunter for confrontation
            newX = Math.max(30, prev[index].position.x - 15)
            newY = hunterPosition.y + (Math.random() - 0.5) * 10
            
            // Check if close enough to start combat
            if (newX <= 40 && !prev[index].inCombat) {
              // Start combat
              setTimeout(() => startGhostConfrontation(prev[index].id), 500)
            }
          } else {
            // Normal movement patterns
            switch (prev[index].movePattern) {
              case 'aggressive':
                newX = Math.max(50, prev[index].position.x - 8)
                newY = hunterPosition.y + (Math.random() - 0.5) * 15
                break
              case 'defensive':
                newX = Math.min(85, Math.max(60, prev[index].position.x + (Math.random() - 0.5) * 10))
                newY = Math.max(20, Math.min(80, prev[index].position.y + (Math.random() - 0.5) * 25))
                break
              case 'erratic':
                newX = Math.max(55, Math.min(90, prev[index].position.x + (Math.random() - 0.5) * 20))
                newY = Math.max(10, Math.min(90, prev[index].position.y + (Math.random() - 0.5) * 35))
                break
            }
          }
          
          return [
            ...prev.slice(0, index),
            {
              ...prev[index],
              position: { x: newX, y: newY }
            },
            ...prev.slice(index + 1)
          ]
        })
        
        setGhostMoving(false)
      }, 800)
    }

    const moveTimer = setTimeout(() => {
      activeGhosts.forEach(ghost => {
        if (!ghost.inCombat) {
          moveGhost(ghost)
        }
      })
    }, 1000)
    
    return () => clearTimeout(moveTimer)
  }, [activeGhosts, gameOver, hunterPosition.y, hunterInRecovery, startGhostConfrontation])

  const resetGame = () => {
    setCurrentPage('hunters')
    setSelectedHunter(null)
    setSelectedWeapon(null)
    setSelectedShield(null)
    setSelectedLocation(null)
    setActiveGhosts([])
    setNextGhostId(1)
    if (spawnTimer) {
      clearInterval(spawnTimer)
      setSpawnTimer(null)
    }
    setCombatLog([])
    setGameOver(false)
    setVictory(false)
    setDamageNumbers([])
    setHunterHealth(100)
    setHunterShield(100)
    setHunterPosition({ x: 20, y: 50 })
    setHunterXP(0)
    setHunterLevel(1)
    setGhostsKilled(0)
    setPlayerEnergy(100)
    setCombatEffects([])
    setHunterInRecovery(false)
    setRecoveryTimeLeft(0)
    setCurrentCombatGhost(null)
  }

  // Format recovery time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderHunterSelection = () => (
    <div className="space-y-8">
      {/* Atmospheric Text */}
      <div className="text-center space-y-6 mb-12">
        <h2 className="font-orbitron text-2xl font-bold text-primary horror-text mb-4">
          The Veil Between Worlds Has Thinned...
        </h2>
        <div className="max-w-4xl mx-auto space-y-4 text-muted-foreground">
          <p>
            For centuries, the supernatural lurked in the shadows—ghosts, cryptids, and malevolent spirits haunting abandoned asylums, forgotten graveyards, and cursed forests.
          </p>
          <p>
            But now, the barriers separating our world from the spectral realm have weakened, unleashing an unprecedented surge of paranormal activity.
          </p>
          <p className="text-accent font-semibold">
            The Ghost Hunters Guild (GHG)—a secretive organization of elite paranormal investigators—has emerged to combat this rising threat. Armed with spectral tech, enchanted relics, and decades of occult knowledge, they venture into the most haunted places on Earth to capture, banish, or study the entities that plague humanity.
          </p>
        </div>
        
        <div className="bg-card/50 border border-accent/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="font-orbitron text-xl font-bold text-accent mb-4">
            Earn Your Keep in Blood and ECTOS
          </h3>
          <p className="text-muted-foreground mb-4">
            The Hunt Pays in More Than Survival
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Every demon banished, every cursed relic recovered, and every nightmare conquered rewards you with ECTOS—the spectral currency that lingers between worlds. Collect them to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Unlock forbidden gear (Weapons that remember their past wielders...)</li>
              <li>Trade with shadow dealers (Their prices always change—just like their faces...)</li>
              <li>Fuel ancient rituals (Some doors require payment in screams AND ECTOS...)</li>
            </ul>
            <p className="text-accent font-semibold mt-4">But the truly worthy claim more...</p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="font-orbitron text-3xl font-bold text-primary horror-text mb-4">
          Join the Ghost Hunters Guild
        </h2>
        <p className="text-muted-foreground mb-8">
          EXPLORE the Darkest Corners of the Supernatural World and discover the GHG Guild
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hunters.map((hunter, index) => (
          <Card
            key={hunter.id}
            className={`p-6 cursor-pointer hunter-card ${
              selectedHunter?.id === hunter.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedHunter(hunter)}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <img 
                  src={hunter.image} 
                  alt={hunter.name} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-accent/30"
                />
              </div>
              <div className="flex justify-center text-accent">
                {hunter.icon}
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-bold text-primary">
                  Character {index + 1}
                </h3>
                <h4 className="font-orbitron text-lg font-bold text-accent">
                  {hunter.name}
                </h4>
                <Badge variant="outline" className="mt-1">
                  Role: {hunter.class}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Health:</span>
                  <span className="text-primary">{hunter.health}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Speed:</span>
                  <span className="text-accent">{hunter.speed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Crit Chance:</span>
                  <span className="text-accent">{hunter.critChance}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-accent">Special:</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hunter.specialAbility}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {hunter.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
      
      {selectedHunter && (
        <div className="flex justify-center">
          <Button
            onClick={() => setCurrentPage('equipment')}
            className="ghost-glow"
            size="lg"
          >
            Continue to Equipment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )

  const renderEquipmentSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-orbitron text-3xl font-bold text-primary horror-text mb-4">
          CHOOSE YOUR EQUIPMENT
        </h2>
        <p className="text-muted-foreground">
          Select a weapon and shield for {selectedHunter?.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weapons */}
        <div>
          <h3 className="font-orbitron text-xl font-bold text-accent violet-text mb-4">
            WEAPONS
          </h3>
          <div className="space-y-4">
            {weapons.map((weapon) => (
              <Card
                key={weapon.id}
                className={`p-4 cursor-pointer hunter-card ${
                  selectedWeapon?.id === weapon.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedWeapon(weapon)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-accent">
                    {weapon.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary">{weapon.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Damage: <span className="text-primary">{weapon.damage}</span></span>
                      <span>Crit: <span className="text-accent">{weapon.critMultiplier}x</span></span>
                      <span className="col-span-2 text-accent">{weapon.special}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Shields */}
        <div>
          <h3 className="font-orbitron text-xl font-bold text-accent violet-text mb-4">
            SHIELDS
          </h3>
          <div className="space-y-4">
            {shields.map((shield) => (
              <Card
                key={shield.id}
                className={`p-4 cursor-pointer hunter-card ${
                  selectedShield?.id === shield.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedShield(shield)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-accent">
                    {shield.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary">{shield.name}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Defense: <span className="text-primary">{shield.defense}</span></span>
                      <span className="text-accent">{shield.special}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setCurrentPage('hunters')}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {selectedWeapon && selectedShield && (
          <Button
            onClick={() => setCurrentPage('location')}
            className="ghost-glow"
            size="lg"
          >
            Continue to Location
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderLocationSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-orbitron text-3xl font-bold text-primary horror-text mb-4">
          CHOOSE LOCATION
        </h2>
        <p className="text-muted-foreground">
          Select an investigation site
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card
            key={location.id}
            className={`p-6 cursor-pointer hunter-card ${
              selectedLocation?.id === location.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedLocation(location)}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center text-accent">
                {location.icon}
              </div>
              <div>
                <h3 className="font-orbitron text-lg font-bold text-primary">
                  {location.name}
                </h3>
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < location.difficulty ? 'text-accent fill-current' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {location.description}
              </p>
              <div className="space-y-1">
                <p className="text-xs text-accent">Ghost Types:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {location.ghostTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setCurrentPage('equipment')}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {selectedLocation && (
          <Button
            onClick={() => setCurrentPage('combat')}
            className="ghost-glow"
            size="lg"
          >
            Begin Investigation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderCombat = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-orbitron text-2xl font-bold text-primary horror-text mb-2">
          INVESTIGATION ZONE
        </h2>
        <p className="text-muted-foreground">{selectedLocation?.name}</p>
        {selectedHunter && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-4 bg-card/50 border border-accent/20 rounded-lg p-4">
              <img 
                src={selectedHunter.image} 
                alt={selectedHunter.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-accent/30"
              />
              <div className="text-left">
                <h3 className="font-orbitron text-lg font-bold text-primary">
                  {selectedHunter.name}
                </h3>
                <p className="text-sm text-accent">{selectedHunter.class}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recovery Status */}
      {hunterInRecovery && (
        <Card className="p-4 bg-red-900/20 border-red-400">
          <div className="text-center">
            <h3 className="font-orbitron text-lg font-bold text-red-400 mb-2">
              RECOVERY MODE
            </h3>
            <p className="text-red-300 mb-2">
              Your hunter is recovering from defeat...
            </p>
            <div className="text-2xl font-bold text-red-400">
              {formatTime(recoveryTimeLeft)}
            </div>
          </div>
        </Card>
      )}

      {/* Hunter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm">Health</span>
            </div>
            <Progress value={(hunterHealth / (selectedHunter?.maxHealth || 100)) * 100} className="health-bar" />
            <div className="text-xs text-muted-foreground">
              {hunterHealth}/{selectedHunter?.maxHealth}
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Shield</span>
            </div>
            <Progress value={hunterShield} className="shield-bar" />
            <div className="text-xs text-muted-foreground">
              {hunterShield}/100
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Energy</span>
            </div>
            <Progress value={playerEnergy} className="energy-bar" />
            <div className="text-xs text-muted-foreground">
              {playerEnergy}/100
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-sm">Level {hunterLevel}</span>
            </div>
            <Progress value={(hunterXP / getXPForLevel(hunterLevel)) * 100} />
            <div className="text-xs text-muted-foreground">
              XP: {hunterXP}/{getXPForLevel(hunterLevel)}
            </div>
          </div>
        </Card>
      </div>

      {/* Combat Area */}
      <Card className="p-6">
        <div 
          ref={combatAreaRef}
          className="combat-zone battle-grid h-80 relative rounded-lg"
        >
          {/* Hunter */}
          <div
            className={`absolute w-8 h-8 rounded-full bg-primary hunter-glow flex items-center justify-center transition-all duration-500 ${
              hunterInRecovery ? 'opacity-50' : ''
            }`}
            style={{
              left: `${hunterPosition.x}%`,
              top: `${hunterPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <User className="w-4 h-4 text-background" />
          </div>

          {/* Ghosts */}
          {activeGhosts.map((ghost) => (
            <div
              key={ghost.id}
              className={`absolute w-8 h-8 rounded-full bg-accent violet-glow flex items-center justify-center transition-all duration-1000 ghost-flicker ${
                ghost.inCombat ? 'attacking' : ''
              } ${ghost.stunned ? 'stunned' : ''}`}
              style={{
                left: `${ghost.position.x}%`,
                top: `${ghost.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Ghost className="w-4 h-4 text-background" />
            </div>
          ))}

          {/* Damage Numbers */}
          {damageNumbers.map((damage) => (
            <div
              key={damage.id}
              className={`absolute damage-number font-bold pointer-events-none ${
                damage.critical ? 'text-red-400 text-xl critical-hit' : 
                damage.type === 'heal' ? 'text-green-400' :
                damage.type === 'shield' ? 'text-blue-400' : 'text-primary'
              }`}
              style={{
                left: `${damage.x}%`,
                top: `${damage.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {damage.type === 'heal' ? '+' : damage.type === 'shield' ? '+' : '-'}{damage.damage}
              {damage.critical && '!'}
            </div>
          ))}

          {/* Combat Effects */}
          {combatEffects.map((effect, index) => (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-orbitron text-2xl font-bold text-accent animate-pulse"
            >
              {effect}
            </div>
          ))}
        </div>
      </Card>

      {/* Combat Log */}
      <Card className="p-4">
        <h3 className="font-orbitron text-lg font-bold text-accent mb-2">Combat Log</h3>
        <div className="combat-log h-32 overflow-y-auto space-y-1 text-sm">
          {combatLog.map((log, index) => (
            <div key={index} className="text-muted-foreground">
              {log}
            </div>
          ))}
        </div>
      </Card>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{ghostsKilled}</div>
          <div className="text-sm text-muted-foreground">Ghosts Defeated</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-accent">{hunterLevel}</div>
          <div className="text-sm text-muted-foreground">Hunter Level</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{activeGhosts.length}</div>
          <div className="text-sm text-muted-foreground">Active Ghosts</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-accent">{selectedLocation?.difficulty || 0}</div>
          <div className="text-sm text-muted-foreground">Difficulty</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={resetGame}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl md:text-6xl font-bold text-primary horror-text mb-4">
            GHOST HUNTERS GUILD
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter the supernatural realm and face the unknown
          </p>
        </div>

        {/* Game Content */}
        {currentPage === 'hunters' && renderHunterSelection()}
        {currentPage === 'equipment' && renderEquipmentSelection()}
        {currentPage === 'location' && renderLocationSelection()}
        {currentPage === 'combat' && renderCombat()}
      </div>
    </div>
  )
}

export default App