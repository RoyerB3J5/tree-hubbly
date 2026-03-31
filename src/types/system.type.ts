import { int } from "astro:schema";

export interface Button {
  label: string;
  href: string;
  styleButton?: string;
  styleLabel?: string;
}

export interface Tag {
  icon: string;
  title: string;
}

export interface HeroSection {
  imageHero: string;
  title: string;
  description: string;
  tags: Tag[];
  buttons: Button[];
}

export interface ProblemItem {
  icon: string;
  title: string;
  description: string;
}
export interface ImageProblemContent {
  image: string;
  description?: string;
}
export interface ProblemSection {
  title: string;
  description: string;
  items: ProblemItem[];
  imageContent: ImageProblemContent;
}

export interface CallActionItem {
  label: string;
  href: string;
  styleButton: string;
  styleLabel: string;
}

export interface CallSection {
  title: string;
  description: string;
  items: string[];
  buttons: CallActionItem[];
}

export interface CharacteristicSection {
  title: string;
  description: string;
  items: {
    icon: string;
    title: string;
    description: string;
    tag?: {
      label: string;
      icon: string;
    };
  }[];
  arrow?: boolean;
}
export interface ListsSection {
  title: string;
  description: string;
  items: {
    icon?: string;
    title: string;
    description: string;
    button?: {
      label: string;
      href: string;
      styleButton: string;
      styleLabel: string;
    };
  }[];
}
export interface DashboardSection {
  image: string;
  title: string;
  description: string;
  items: string[];
}

export interface InformationSection {
  lists: ListsSection;
  dashboard: DashboardSection;
}

export interface SystemPage {
  hero: HeroSection;
  problem?: ProblemSection;
  information?: InformationSection;
  characteristics: CharacteristicSection;
  call: CallSection;
}
export interface VentoSection {
  title: string;
  description: string;
  items: {
    icon: string;
    title: string;
    description: string;
    back: string;
    backIcon: string;
    textColor: string;
    image?: {
      src: string;
      width: string;
      height: string;
    };
  }[];
}
export interface ExpectationsSection {
  title: string;
  description: string;
  items: {
    title: string;
    description: string;
    image: string;
  }[];
}

export interface MattersSection {
  title: string;
  description: string;
  items: {
    icon: string;
    label: string;
  }[];
  description2: string;
}
export interface StadisticsSection {
  title: string;
  description: string;
  lists?: {
    title: string;
    description: string;
  }[];
  items?: string[];
  image: string;
  different?: boolean;
}

export interface VentoMove1Section {
  title: string;
  description: string;
  items: {
    title: string;
    description: string;
    icon: string;
  }[];
  vento1: string;
  vento4: string;
}
export interface SolutionPage {
  hero: HeroSection;
  ventoMarketing?: VentoSection;
  expectations?: ExpectationsSection;
  lists: ListsSection;
  matters?: MattersSection;
  stadistic?: StadisticsSection;
  characteristics?: CharacteristicSection;
  ventoMove1?: VentoMove1Section;
  call: CallSection;
}
