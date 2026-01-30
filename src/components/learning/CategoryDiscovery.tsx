import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronDown,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterState {
  domains: string[];
  skillAreas: string[];
  availability: 'all' | 'live' | 'upcoming';
  searchQuery: string;
}

interface CategoryDiscoveryProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  domains: string[];
  skillAreas: string[];
}

export function CategoryDiscovery({ 
  filters, 
  onFilterChange, 
  domains, 
  skillAreas 
}: CategoryDiscoveryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = 
    filters.domains.length + 
    filters.skillAreas.length + 
    (filters.availability !== 'all' ? 1 : 0);

  const handleDomainToggle = (domain: string) => {
    const newDomains = filters.domains.includes(domain)
      ? filters.domains.filter(d => d !== domain)
      : [...filters.domains, domain];
    onFilterChange({ ...filters, domains: newDomains });
  };

  const handleSkillAreaToggle = (area: string) => {
    const newAreas = filters.skillAreas.includes(area)
      ? filters.skillAreas.filter(a => a !== area)
      : [...filters.skillAreas, area];
    onFilterChange({ ...filters, skillAreas: newAreas });
  };

  const handleAvailabilityChange = (value: 'all' | 'live' | 'upcoming') => {
    onFilterChange({ ...filters, availability: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      domains: [],
      skillAreas: [],
      availability: 'all',
      searchQuery: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Main Filter Toggle */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions, teachers, or topics..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Domain Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Domain
                {filters.domains.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {filters.domains.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Domain</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {domains.map((domain) => (
                <DropdownMenuCheckboxItem
                  key={domain}
                  checked={filters.domains.includes(domain)}
                  onCheckedChange={() => handleDomainToggle(domain)}
                >
                  {domain}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Skill Area Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Skill Area
                {filters.skillAreas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {filters.skillAreas.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Skill</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {skillAreas.map((area) => (
                <DropdownMenuCheckboxItem
                  key={area}
                  checked={filters.skillAreas.includes(area)}
                  onCheckedChange={() => handleSkillAreaToggle(area)}
                >
                  {area}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Filters */}
          <Button 
            variant={isExpanded ? "secondary" : "outline"} 
            className="gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            More
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              {/* Availability Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Availability
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'live', 'upcoming'] as const).map((option) => (
                    <Button
                      key={option}
                      variant={filters.availability === option ? 'chrono' : 'outline'}
                      size="sm"
                      onClick={() => handleAvailabilityChange(option)}
                      className="capitalize"
                    >
                      {option === 'all' ? 'All Sessions' : option === 'live' ? 'Live Now' : 'Upcoming'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {filters.domains.map((domain) => (
                      <Badge 
                        key={domain} 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => handleDomainToggle(domain)}
                      >
                        {domain}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.skillAreas.map((area) => (
                      <Badge 
                        key={area} 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => handleSkillAreaToggle(area)}
                      >
                        {area}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.availability !== 'all' && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => handleAvailabilityChange('all')}
                      >
                        {filters.availability === 'live' ? 'Live Now' : 'Upcoming'}
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
