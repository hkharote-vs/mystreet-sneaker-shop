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
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine();
            if (header == null) {
                return new CsvImportResult(0, 0, List.of("File is empty"));
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

                    var product = new Product();
                    product.setName(col(cols, 0));
                    product.setBrand(col(cols, 1));
                    product.setDescription(colOrNull(cols, 2));
                    product.setPrice(new BigDecimal(col(cols, 3)));
                    product.setImageUrl(colOrNull(cols, 4));
                    product.setSizesCsv(colOrNull(cols, 5));
                    product.setStockQty(Integer.parseInt(col(cols, 6)));
                    productRepository.save(product);
                    imported++;
                } catch (Exception e) {
                    errors.add("Row " + row + ": " + e.getMessage());
                    skipped++;
                }
            }
        }
        return new CsvImportResult(imported, skipped, errors);
    }

    // Splits a CSV line respecting double-quoted fields
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
