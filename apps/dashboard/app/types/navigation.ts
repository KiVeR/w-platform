import type { Component } from 'vue'
import type { Role, Permission } from './auth'

export interface NavItem {
  label: string
  icon: Component
  to: string
  requiredRoles?: Role[]
  requiredPermissions?: Permission[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
  requiredRoles?: Role[]
  requiredPermissions?: Permission[]
}
