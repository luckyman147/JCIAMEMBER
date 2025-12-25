import React, { useState } from 'react';
import { 
  GroupObjectif, 
  ObjectifActionType, 
  FeaturesType, 
  ObjectifDifficulty, 
  PrivacyType, 
  CibleType,
  type Objectif 
} from '../../types/objectives';

import { 
  getActionTypesByGroup, 
  getFeaturesByGroup, 
  isPrivacyNullForGroup,
} from '../../constants/objectives';
import { objectivesService } from '../../services/objectivesService';
import { useTranslation } from "react-i18next";

const CreateObjectifForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Objectif>>({
    groupObjectif: undefined,
    objectifActionType: undefined,
    feature: undefined,
    difficulty: undefined,
    privacy: undefined,
    cible: [],
    target: 1,
    points: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state options
  const [availableActions, setAvailableActions] = useState<ObjectifActionType[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<FeaturesType[]>([]);
  const [isPrivacyDisabled, setIsPrivacyDisabled] = useState(false);

  // Handle Group Change
  const handleGroupChange = (group: GroupObjectif) => {
    const actions = getActionTypesByGroup(group);
    setAvailableActions(actions);
    
    // Check privacy
    const privacyNull = isPrivacyNullForGroup(group);
    setIsPrivacyDisabled(privacyNull);

    setFormData(prev => ({
      ...prev,
      groupObjectif: group,
      objectifActionType: undefined, // Reset dependent fields
      feature: undefined,
      privacy: privacyNull ? undefined : prev.privacy
    }));
  };

  // Handle Action Change
  const handleActionChange = (action: ObjectifActionType) => {
    if (!formData.groupObjectif) return;
    const features = getFeaturesByGroup(formData.groupObjectif, action);
    setAvailableFeatures(features);

    setFormData(prev => ({
      ...prev,
      objectifActionType: action,
      feature: undefined // Reset feature
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupObjectif || !formData.objectifActionType || !formData.feature) {
      setError(t('profile.fillRequiredFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await objectivesService.createObjective(formData as Omit<Objectif, 'id'>);
      setFormData({
        groupObjectif: undefined,
        objectifActionType: undefined,
        feature: undefined,
        difficulty: undefined,
        privacy: undefined,
        cible: [],
        target: 1,
        points: 0
      });
      alert(t('profile.objectiveCreatedSuccess'));
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || t('profile.deleteObjectiveFailed')); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleCible = (cible: CibleType) => {
    setFormData(prev => {
      const current = prev.cible || [];
      const updated = current.includes(cible) 
        ? current.filter(c => c !== cible) 
        : [...current, cible];
      return { ...prev, cible: updated };
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{t('profile.createNewObjective')}</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.group')}</label>
          <select 
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.groupObjectif || ''}
            onChange={(e) => handleGroupChange(e.target.value as GroupObjectif)}
            required
          >
            <option value="">{t('common.select', 'Select...')}</option>
            {Object.values(GroupObjectif).map(g => (
              <option key={g} value={g}>{t(`objectives.group.${g}`, { defaultValue: g })}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.action')}</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              value={formData.objectifActionType || ''}
              onChange={(e) => handleActionChange(e.target.value as ObjectifActionType)}
              disabled={!formData.groupObjectif}
              required
            >
              <option value="">{t('common.select', 'Select...')}</option>
              {availableActions.map(a => (
                <option key={a} value={a}>{t(`objectives.action.${a}`, { defaultValue: a })}</option>
              ))}
            </select>
          </div>

          {/* Feature Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.feature')}</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              value={formData.feature || ''}
              onChange={(e) => setFormData(p => ({ ...p, feature: e.target.value as FeaturesType }))}
              disabled={!formData.objectifActionType}
              required
            >
              <option value="">{t('common.select', 'Select...')}</option>
              {availableFeatures.map(f => (
                <option key={f} value={f}>{t(`objectives.feature.${f}`, { defaultValue: f })}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.difficulty')}</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.difficulty || ''}
              onChange={(e) => setFormData(p => ({ ...p, difficulty: e.target.value as ObjectifDifficulty }))}
            >
              <option value="">{t('common.auto')}</option>
              {Object.values(ObjectifDifficulty).map(d => (
                <option key={d} value={d}>{t(`profile.difficulty${d}`, { defaultValue: d })}</option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.privacy')}</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              value={formData.privacy || ''}
              onChange={(e) => setFormData(p => ({ ...p, privacy: e.target.value as PrivacyType }))}
              disabled={isPrivacyDisabled}
            >
              <option value="">{t('common.public')}</option>
              {Object.values(PrivacyType).map(p => (
                <option key={p} value={p}>{t(`objectives.privacy.${p}`, { defaultValue: p })}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Points */}
           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('profile.pointsReward')}</label>
            <input 
              type="number"
              min="0"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.points}
              onChange={(e) => setFormData(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
            />
          </div>

           {/* Target Count */}
           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('profile.targetCount')}</label>
            <input 
              type="number"
              min="1"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.target}
              onChange={(e) => setFormData(p => ({ ...p, target: parseInt(e.target.value) || 1 }))}
              placeholder={t('profile.target')}
            />
          </div>
        </div>

        {/* Cible (Targets) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('profile.targetRoles')}</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(CibleType).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleCible(role)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  (formData.cible || []).includes(role)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {t(`objectives.role.${role}`, { defaultValue: role })}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? t('profile.creatingObjective') : t('profile.createObjective')}
          </button>
        </div>

      </form>
    </div>
  );
};
export default CreateObjectifForm;
