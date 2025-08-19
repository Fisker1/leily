import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={language === 'no' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('no')}
        className="h-8 px-3 text-sm"
      >
        NO
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-8 px-3 text-sm"
      >
        EN
      </Button>
    </div>
  );
};

export default LanguageToggle;