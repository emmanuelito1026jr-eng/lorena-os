export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly iconName: 'Home' | 'TrendingUp' | 'Building';
}

export interface Neighborhood {
  readonly name: string;
  readonly description: string;
  readonly image: string;
}

export interface Testimonial {
  readonly name: string;
  readonly text: string;
  readonly role: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
}

export interface Stat {
  readonly label: string;
  readonly value: string;
}

export interface ContactFormData {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly type: 'Buying' | 'Selling' | 'Investing' | 'Information';
}
