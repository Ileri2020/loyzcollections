import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, ShoppingBag, Star, Truck } from 'lucide-react';
import React from 'react'

const Features = () => {
    const featuresWhyChooseUs = [
        {
          description:
            "Fast shipping for all orders over within Nigeria. Fast and reliable delivery to your doorstep.",
          icon: <Truck className="h-6 w-6 text-primary" />,
          title: "Fast Shipping",
        },
        {
          description:
            "Your payment information is always safe and secure with us. We use industry-leading encryption.",
          icon: <ShoppingBag className="h-6 w-6 text-primary" />,
          title: "Secure Checkout",
        },
        {
          description:
            "Our customer support team is always available to help with any questions or concerns.",
          icon: <Clock className="h-6 w-6 text-primary" />,
          title: "24/7 Support",
        },
        {
          description:
            "We stand behind the quality of every product we sell. 30-day money-back guarantee.",
          icon: <Star className="h-6 w-6 text-primary" />,
          title: "Quality Guarantee",
        },
      ];
  return (
    <section
    className={`
      py-12
      md:py-16
    `}
    id="features"
  >
    {/* Features Section */}
    <div
      className={`
        container mx-auto max-w-7xl px-4
        sm:px-6
        lg:px-8
      `}
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <h2
          className={`
            font-display text-3xl leading-tight font-bold tracking-tight
            md:text-4xl
          `}
        >
          Why Choose Us
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
        <p
          className={`
            mt-4 max-w-2xl text-center text-muted-foreground
            md:text-lg
          `}
        >
          We offer the best shopping experience for stylish, quality clothing.
          Loyz Collection is committed to delivering fashionable apparel with exceptional craftsmanship, premium fabrics, and thoughtful design. Our pieces are carefully curated to help you look your best every day, while our easy shopping experience, dependable shipping, and attentive support make it simple to refresh your wardrobe with confidence. Shop with us for timeless style, trusted quality, and a brand that puts your comfort and elegance first.
        </p>
      </div>
      <div
        className={`
          grid gap-8
          md:grid-cols-2
          lg:grid-cols-4
        `}
      >
        {featuresWhyChooseUs.map((feature) => (
          <Card
            className={`
              rounded-2xl border-none bg-background shadow transition-all
              duration-300
              hover:shadow-lg
              shadow-md shadow-accent/40 rounded-2xl
            `}
            key={feature.title}
          >
            <CardHeader className="pb-2">
              <div
                className={`
                  mb-3 flex h-12 w-12 items-center justify-center
                  rounded-full bg-primary/10
                `}
              >
                {feature.icon}
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
  )
}

export default Features