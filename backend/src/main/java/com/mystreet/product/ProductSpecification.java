package com.mystreet.product;

import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> hasBrand(String brand) {
        return (root, query, cb) ->
            brand == null || brand.isBlank()
                ? cb.conjunction()
                : cb.equal(cb.lower(root.get("brand")), brand.toLowerCase());
    }

    public static Specification<Product> hasSize(String size) {
        return (root, query, cb) ->
            size == null || size.isBlank()
                ? cb.conjunction()
                : cb.like(root.get("sizesCsv"), "%" + size + "%");
    }

    public static Specification<Product> isInStock() {
        return (root, query, cb) -> cb.greaterThan(root.get("stockQty"), 0);
    }
}
