import { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  User, 
  Star, 
  Coins, 
  Package, 
  BookOpen, 
  TreePine, 
  Hammer,
  Sword,
  Shield,
  Heart,
  Zap,
  Target,
  Ghost,
  Skull,
  Eye,
  Lock,
  Unlock,
  Plus,
  Minus,
  Crown,
  Gem,
  Sparkles
} from 'lucide-react'

interface Hunter {
  id: string
  name: string
  class: string
  level: number
  xp: number
  ectos: number
  health: number
  maxHealth: number
  speed: number
  critChance: number
  image: string
}

interface Material {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description: string
  quantity: number
  sourceGhost: string
}

interface Equipment {
  id: string
  name: string
  type: 'weapon' | 'shield' | 'armor'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  damage?: number
  defense?: number
  special: string
  crafted: boolean
  equipped: boolean
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

interface GameMenuProps {
  hunter: Hunter
  materials: Material[]
  equipment: Equipment[]
  bestiary: BestiaryEntry[]
  skills: Skill[]
  craftingRecipes: CraftingRecipe[]
  onClose: () => void
  onCraftItem: (recipeId: string) => void
  onUpgradeSkill: (skillId: string) => void
  onEquipItem: (itemId: string) => void
}

const rarityColors = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
}

const rarityBorders = {
  common: 'border-gray-400/30',
  uncommon: 'border-green-400/30',
  rare: 'border-blue-400/30',
  epic: 'border-purple-400/30',
  legendary: 'border-yellow-400/30'
}

const skillTypeColors = {
  combat: 'text-red-400',
  survival: 'text-green-400',
  occult: 'text-purple-400'
}

export function GameMenu({ 
  hunter, 
  materials, 
  equipment, 
  bestiary, 
  skills, 
  craftingRecipes,
  onClose, 
  onCraftItem, 
  onUpgradeSkill,
  onEquipItem 
}: GameMenuProps) {
  const [activeTab, setActiveTab] = useState('inventory')

  const getXPForLevel = (level: number) => level * 50

  const canCraftItem = (recipe: CraftingRecipe) => {
    return Object.entries(recipe.requiredMaterials).every(([materialName, required]) => {
      const material = materials.find(m => m.name.toLowerCase().replace(/\s+/g, '_') === materialName)
      return material && material.quantity >= required
    })
  }

  const canUpgradeSkill = (skill: Skill) => {
    const cost = (skill.level + 1) * 10 // 10 ectos per level
    return skill.unlocked && skill.level < skill.maxLevel && hunter.ectos >= cost
  }

  const renderInventory = () => (
    <div className="space-y-6">
      {/* Hunter Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={hunter.image} 
            alt={hunter.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-accent/30"
          />
          <div>
            <h3 className="font-orbitron text-xl font-bold text-primary">{hunter.name}</h3>
            <p className="text-accent">{hunter.class}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-sm">Level {hunter.level}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{hunter.ectos.toFixed(2)} ECTOS</span>
            </div>
            <div className="text-sm text-muted-foreground">
              XP: {hunter.xp}/{getXPForLevel(hunter.level)}
            </div>
            <Progress 
              value={(hunter.xp / getXPForLevel(hunter.level)) * 100} 
              className="w-32 mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-sm text-muted-foreground">Health</div>
            <div className="font-bold text-primary">{hunter.health}/{hunter.maxHealth}</div>
          </div>
          <div className="text-center">
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-sm text-muted-foreground">Speed</div>
            <div className="font-bold text-accent">{hunter.speed}</div>
          </div>
          <div className="text-center">
            <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-sm text-muted-foreground">Crit Chance</div>
            <div className="font-bold text-accent">{hunter.critChance}%</div>
          </div>
        </div>
      </Card>

      {/* Equipment */}
      <Card className="p-6">
        <h3 className="font-orbitron text-lg font-bold text-accent mb-4">Equipment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <Card 
              key={item.id} 
              className={`p-4 ${rarityBorders[item.rarity]} ${item.equipped ? 'bg-accent/10' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {item.type === 'weapon' && <Sword className="w-5 h-5 text-accent" />}
                {item.type === 'shield' && <Shield className="w-5 h-5 text-accent" />}
                {item.type === 'armor' && <Crown className="w-5 h-5 text-accent" />}
                <div>
                  <h4 className={`font-semibold ${rarityColors[item.rarity]}`}>{item.name}</h4>
                  <Badge variant="outline" className="text-xs">{item.rarity}</Badge>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {item.damage && <div>Damage: <span className="text-primary">{item.damage}</span></div>}
                {item.defense && <div>Defense: <span className="text-primary">{item.defense}</span></div>}
                <div className="text-accent text-xs">{item.special}</div>
              </div>
              <Button 
                size="sm" 
                variant={item.equipped ? "secondary" : "outline"}
                className="w-full mt-2"
                onClick={() => onEquipItem(item.id)}
              >
                {item.equipped ? 'Equipped' : 'Equip'}
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Materials */}
      <Card className="p-6">
        <h3 className="font-orbitron text-lg font-bold text-accent mb-4">Materials</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {materials.map((material) => (
            <Card key={material.id} className={`p-3 ${rarityBorders[material.rarity]}`}>
              <div className="text-center">
                <Gem className={`w-6 h-6 mx-auto mb-2 ${rarityColors[material.rarity]}`} />
                <h4 className={`font-semibold text-sm ${rarityColors[material.rarity]}`}>
                  {material.name}
                </h4>
                <div className="text-lg font-bold text-primary">{material.quantity}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  From: {material.sourceGhost}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderBestiary = () => (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-orbitron text-lg font-bold text-accent mb-4">Ghost Encounters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestiary.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Ghost className="w-6 h-6 text-accent" />
                <div>
                  <h4 className="font-semibold text-primary">{entry.ghostName}</h4>
                  <div className="text-sm text-muted-foreground">{entry.location}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Encountered</div>
                  <div className="font-bold text-accent">{entry.timesEncountered}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Defeated</div>
                  <div className="font-bold text-primary">{entry.timesDefeated}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">Success Rate</div>
                <Progress 
                  value={entry.timesEncountered > 0 ? (entry.timesDefeated / entry.timesEncountered) * 100 : 0}
                  className="mt-1"
                />
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderSkillTree = () => (
    <div className="space-y-6">
      {['combat', 'survival', 'occult'].map((skillType) => (
        <Card key={skillType} className="p-6">
          <h3 className={`font-orbitron text-lg font-bold mb-4 ${skillTypeColors[skillType as keyof typeof skillTypeColors]}`}>
            {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Skills
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.filter(skill => skill.type === skillType).map((skill) => (
              <Card key={skill.id} className={`p-4 ${skill.unlocked ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {skill.unlocked ? (
                    <Unlock className={`w-5 h-5 ${skillTypeColors[skill.type as keyof typeof skillTypeColors]}`} />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h4 className="font-semibold text-primary">{skill.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      Level {skill.level}/{skill.maxLevel}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={(skill.level / skill.maxLevel) * 100} className="flex-1" />
                  <Button
                    size="sm"
                    disabled={!canUpgradeSkill(skill)}
                    onClick={() => onUpgradeSkill(skill.id)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {skill.unlocked && skill.level < skill.maxLevel && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Cost: {(skill.level + 1) * 10} ECTOS
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )

  const renderCrafting = () => (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-orbitron text-lg font-bold text-accent mb-4">Crafting Recipes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {craftingRecipes.map((recipe) => (
            <Card key={recipe.id} className={`p-4 ${rarityBorders[recipe.rarity]}`}>
              <div className="flex items-center gap-3 mb-3">
                {recipe.itemType === 'weapon' && <Sword className="w-5 h-5 text-accent" />}
                {recipe.itemType === 'shield' && <Shield className="w-5 h-5 text-accent" />}
                {recipe.itemType === 'armor' && <Crown className="w-5 h-5 text-accent" />}
                <div>
                  <h4 className={`font-semibold ${rarityColors[recipe.rarity]}`}>
                    {recipe.itemName}
                  </h4>
                  <Badge variant="outline" className="text-xs">{recipe.rarity}</Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
              
              <div className="space-y-2 mb-3">
                <div className="text-sm font-semibold text-accent">Required Materials:</div>
                {Object.entries(recipe.requiredMaterials).map(([materialName, required]) => {
                  const material = materials.find(m => m.name.toLowerCase().replace(/\s+/g, '_') === materialName)
                  const hasEnough = material && material.quantity >= required
                  return (
                    <div key={materialName} className={`text-sm flex justify-between ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{materialName.replace(/_/g, ' ')}</span>
                      <span>{material?.quantity || 0}/{required}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="space-y-1 mb-3 text-sm">
                {recipe.stats.damage && <div>Damage: <span className="text-primary">{recipe.stats.damage}</span></div>}
                {recipe.stats.defense && <div>Defense: <span className="text-primary">{recipe.stats.defense}</span></div>}
                <div className="text-accent text-xs">{recipe.stats.special}</div>
              </div>
              
              <Button
                className="w-full"
                disabled={!canCraftItem(recipe)}
                onClick={() => onCraftItem(recipe.id)}
              >
                <Hammer className="w-4 h-4 mr-2" />
                Craft Item
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-orbitron text-3xl font-bold text-primary horror-text">
            Hunter Menu
          </h2>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="bestiary" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Bestiary
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <TreePine className="w-4 h-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="crafting" className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Crafting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6">
            {renderInventory()}
          </TabsContent>

          <TabsContent value="bestiary" className="mt-6">
            {renderBestiary()}
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            {renderSkillTree()}
          </TabsContent>

          <TabsContent value="crafting" className="mt-6">
            {renderCrafting()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}