package com.mystreet.product;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductImportService {

    private final ProductRepository productRepository;

    public ProductImportService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public CsvImportResult importCsv(MultipartFile file) throws IOException {
        int inserted = 0;
        int updated  = 0;
        int skipped  = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine();
            if (header == null) {
                return new CsvImportResult(0, 0, 0, List.of("File is empty"));
            }

            String line;
            int row = 1;
            while ((line = reader.readLine()) != null) {
                row++;
                if (line.isBlank()) continue;
                try {
                    String[] cols = parseLine(line);
                    if (cols.length < 7) {
                        errors.add("Row " + row + ": expected 7 columns, got " + cols.length);
                        skipped++;
                        continue;
                    }

                    String name  = col(cols, 0);
                    String brand = col(cols, 1);

                    // Delta: find existing product by name + brand (case-insensitive)
                    var existing = productRepository.findByNameIgnoreCaseAndBrandIgnoreCase(name, brand);

                    Product product = existing.orElseGet(Product::new);
                    boolean isNew = existing.isEmpty();

                    product.setName(name);
                    product.setBrand(brand);
                    product.setDescription(colOrNull(cols, 2));
                    product.setPrice(new BigDecimal(col(cols, 3)));
                    product.setImageUrl(colOrNull(cols, 4));
                    product.setSizesCsv(colOrNull(cols, 5));
                    product.setStockQty(Integer.parseInt(col(cols, 6)));

                    productRepository.save(product);

                    if (isNew) inserted++; else updated++;

                } catch (Exception e) {
                    errors.add("Row " + row + ": " + e.getMessage());
                    skipped++;
                }
            }
        }
        return new CsvImportResult(inserted, updated, skipped, errors);
    }

    /** Export all current products as a CSV string. */
    public String exportCsv() {
        var sb = new StringBuilder();
        sb.append("name,brand,description,price,imageUrl,sizesCsv,stockQty\n");
        for (Product p : productRepository.findAll()) {
            sb.append(csvField(p.getName())).append(',')
              .append(csvField(p.getBrand())).append(',')
              .append(csvField(p.getDescription())).append(',')
              .append(p.getPrice().toPlainString()).append(',')
              .append(csvField(p.getImageUrl())).append(',')
              .append(csvField(p.getSizesCsv())).append(',')
              .append(p.getStockQty()).append('\n');
        }
        return sb.toString();
    }

    // Wraps a field in double-quotes and escapes internal quotes.
    private String csvField(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String[] parseLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString().trim());
        return fields.toArray(new String[0]);
    }

    private String col(String[] cols, int i) {
        return cols[i].replaceAll("^\"|\"$", "").trim();
    }

    private String colOrNull(String[] cols, int i) {
        String v = col(cols, i);
        return v.isEmpty() ? null : v;
    }
}
