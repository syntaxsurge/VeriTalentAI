'use client'

import * as React from 'react'

import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                               R O O T                                      */
/* -------------------------------------------------------------------------- */

const Tabs = TabsPrimitive.Root

/* -------------------------------------------------------------------------- */
/*                                L I S T                                     */
/* -------------------------------------------------------------------------- */

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('bg-muted inline-flex items-center justify-center rounded-md p-1', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/* -------------------------------------------------------------------------- */
/*                              T R I G G E R                                 */
/* -------------------------------------------------------------------------- */

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'text-muted-foreground rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      'data-[state=active]:bg-background data-[state=active]:text-foreground',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/* -------------------------------------------------------------------------- */
/*                             C O N T E N T                                  */
/* -------------------------------------------------------------------------- */

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
