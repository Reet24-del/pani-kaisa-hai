import type {SchemaTypeDefinition} from 'sanity'

import {adviceType} from './advice'
import {alertType} from './alert'
import {areaType} from './area'
import {contactType} from './contact'
import {reportType} from './report'
import {reporterContactType} from './reporterContact'
import {riskSettingsType} from './riskSettings'
import {safetyLimitType} from './safetyLimit'
import {waterCaseType} from './waterCase'
import {waterSourceType} from './waterSource'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    // Places and plumbing
    areaType,
    waterSourceType,
    // Evidence
    reportType,
    reporterContactType,
    // Decisions
    waterCaseType,
    alertType,
    // Rules and people
    safetyLimitType,
    riskSettingsType,
    adviceType,
    contactType,
  ],
}
