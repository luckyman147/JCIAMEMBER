import { useState, useEffect } from 'react'
import { activityService } from '../../../services/activityService'
import { createCategory, type Category } from '../../../../Members/services/members.service'
import { Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CategorySectionProps {
  selectedCategoryIds: number[]
  onCategoriesChange: (categoryIds: number[]) => void
  disabled?: boolean
}

export default function CategorySection({ 
  selectedCategoryIds, 
  onCategoriesChange,
  disabled = false 
}: CategorySectionProps) {
  const { t } = useTranslation()
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create category state
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const categories = await activityService.getCategories()
        setAvailableCategories(categories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleCategoryToggle = (categoryId: number) => {
    if (disabled) return
    
    const isSelected = selectedCategoryIds.includes(categoryId)
    if (isSelected) {
      onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategoryIds, categoryId])
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCreateError(t('profile.categoryNameEmpty'))
      return
    }
    
    setCreating(true)
    setCreateError(null)
    
    try {
      const newCategory = await createCategory(newCategoryName)
      if (newCategory) {
        // Add to available categories list
        setAvailableCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
        // Auto-select the new category
        onCategoriesChange([...selectedCategoryIds, newCategory.id])
        // Reset form
        setNewCategoryName("")
        setShowCreateInput(false)
      }
    } catch (error: any) {
      if (error.message === 'Category already exists') {
        setCreateError(t('profile.categoryExists'))
      } else {
        setCreateError(t('profile.categoryCreateFailed'))
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateInput(false)
    setNewCategoryName("")
    setCreateError(null)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4 text-start">
        <Tag className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('activities.categoriesTitle')}</h3>
        <span className="text-sm text-gray-500">{t('activities.optional')}</span>
      </div>

      <div className="space-y-4 text-start">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('activities.selectCategoriesDesc')}
          </p>
          {!showCreateInput && (
            <button
              type="button"
              onClick={() => setShowCreateInput(true)}
              disabled={disabled}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('activities.addCategory')}
            </button>
          )}
        </div>

        {/* Create Category Input */}
        {showCreateInput && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value)
                  setCreateError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                  if (e.key === 'Escape') handleCancelCreate()
                }}
                placeholder={t('activities.addCategoryPlaceholder') || t('profile.addCategory')}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                autoFocus
                disabled={creating}
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creating || !newCategoryName.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "..." : t('profile.create')}
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={creating}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                {t('profile.cancel')}
              </button>
            </div>
            {createError && (
              <p className="mt-2 text-xs text-red-600">{createError}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500">{t('activities.loadingCategories')}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryToggle(cat.id)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedCategoryIds.includes(cat.id)
                    ? 'bg-(--color-myPrimary) text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {cat.name}
                {selectedCategoryIds.includes(cat.id) && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
            {availableCategories.length === 0 && (
              <span className="text-sm text-gray-500">{t('activities.noCategories')}</span>
            )}
          </div>
        )}

        {selectedCategoryIds.length > 0 && (
          <p className="text-xs text-gray-500">
            {t('activities.categoriesSelected', { count: selectedCategoryIds.length })}
          </p>
        )}
      </div>
    </div>
  )
}
