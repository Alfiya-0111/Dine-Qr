import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function NewItemsSlider({ items }) {
  if (!items.length) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4 text-[#8A244B]">
        🆕 Newly Added Dishes
      </h2>

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
        {items.map(item => (
          <SwiperSlide key={item.id}>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <img
                src={item.imageUrl}
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
    </div>
  );
}
