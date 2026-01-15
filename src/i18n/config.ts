import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enNav from './locales/en/nav.json';
import enHome from './locales/en/home.json';
import enMembers from './locales/en/members.json';
import enProfile from './locales/en/profile.json';
import enTeams from './locales/en/teams.json';
import enRecruitment from './locales/en/recruitment.json';
import enActivities from './locales/en/activities.json';
import enObjectives from './locales/en/objectives.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frNav from './locales/fr/nav.json';
import frHome from './locales/fr/home.json';
import frMembers from './locales/fr/members.json';
import frProfile from './locales/fr/profile.json';
import frTeams from './locales/fr/teams.json';
import frRecruitment from './locales/fr/recruitment.json';
import frActivities from './locales/fr/activities.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arNav from './locales/ar/nav.json';
import arHome from './locales/ar/home.json';
import arMembers from './locales/ar/members.json';
import arProfile from './locales/ar/profile.json';
import arTeams from './locales/ar/teams.json';
import arRecruitment from './locales/ar/recruitment.json';
import arActivities from './locales/ar/activities.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        common: {
          ...enCommon,
          auth: enAuth,
          nav: enNav,
          home: enHome,
          members: enMembers,
          profile: enProfile,
          teams: enTeams,
          recruitment: enRecruitment,
          activities: enActivities,
          objectives: enObjectives
        }
      },
      fr: { 
        common: {
          ...frCommon,
          auth: frAuth,
          nav: frNav,
          home: frHome,
          members: frMembers,
          profile: frProfile,
          teams: frTeams,
          recruitment: frRecruitment,
          activities: frActivities
        }
      },
      ar: { 
        common: {
          ...arCommon,
          auth: arAuth.auth,
          nav: arNav.nav,
          home: arHome.home,
          members: arMembers.members,
          profile: arProfile.profile,
          teams: arTeams.teams,
          recruitment: arRecruitment.recruitment,
          activities: arActivities.activities
        }
      }
    },
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

export default i18n;
