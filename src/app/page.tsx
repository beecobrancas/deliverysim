import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { Reviews } from "@/components/Reviews";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProductGrid />

      <section className="py-12 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CountdownTimer initialMinutes={38} initialSeconds={50} />
        </div>
      </section>

      <Reviews />
    </div>
  );
}