import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Platewithspoons from "../assets/Platewithspoons.png";

export default function NewItemsSlider({ items, theme }) {
  if (!items?.length) return null;

  const handleDishClick = (dishId) => {
    const el = document.getElementById(`dish-${dishId}`);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // optional highlight effect ✨
      el.classList.add("ring-2", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-offset-2");
      }, 1200);
    }
  };

  return (
    <div
      className="mb-12"
      style={{
        "--theme-primary": theme.primary,
        "--theme-border": theme.border,
      }}
    >
     
      {/* SLIDER */}
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1.2}
        spaceBetween={16}
        autoplay={{ delay: 3000 }}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div
              onClick={() => handleDishClick(item.id)}
              className="bg-white rounded-2xl shadow overflow-hidden cursor-pointer hover:scale-[1.02] transition"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-36 w-full object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
       {/* TITLE */}
      <h2
        className="text-2xl font-bold mb-3 text-center"
        style={{ color: theme.primary }}
      >
        Newly Added Dishes
      </h2>

      {/* DECOR */}
      <div className="flex justify-center mb-6">
        <img src={Platewithspoons} alt="plate" className="h-10" />
      </div>

    </div>
  );
}