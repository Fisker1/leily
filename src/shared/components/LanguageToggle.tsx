import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown } from 'lucide-react';

const FLAGS = {
  no: '🇳🇴',
  sv: '🇸🇪', 
  da: '🇩🇰',
  en: '🇬🇧'
};

const LANGUAGE_NAMES = {
  no: 'Norsk',
  sv: 'Svenska',
  da: 'Dansk', 
  en: 'English'
};

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 px-3 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
        >
          <span className="text-lg mr-2">{FLAGS[language]}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-background border border-border shadow-lg z-50"
      >
        {Object.entries(FLAGS).map(([lang, flag]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as 'en' | 'no')}
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <span className="text-lg mr-3">{flag}</span>
            <span className="text-sm">{LANGUAGE_NAMES[lang as keyof typeof LANGUAGE_NAMES]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;