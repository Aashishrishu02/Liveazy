type ProductCardProps = {
    image: string;
    name: string;
    price:string;
};

function ProductCard({ image, name, price }: ProductCardProps) {
    return (
        <div className="product-card">
            <img src={image} alt={name}/>

            <div className="product-info">
                <h3>{name}</h3>
                <p>${price}/month</p>

                <button> Rent Now </button>
            </div>
        </div>
    );
}

export default ProductCard;