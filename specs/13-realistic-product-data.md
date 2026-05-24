# SPEC-13: Realistic Product Data — CSV Import

**Status:** `[x] Complete`  
**Depends on:** SPEC-03 (product backend), SPEC-10 (admin frontend)  
**Blocks:** Nothing — enhancement step before final demo

---

## Overview

Replace the placeholder seed data with 20 real sneakers — actual model names,
realistic INR prices, and publicly accessible image URLs. Implement a CSV bulk-import
endpoint in the backend (admin only) so future product updates can be done via
spreadsheet instead of SQL.

---

## Part A — Realistic CSV File

Create `data/products.csv` at the repo root:

```
name,brand,description,price,imageUrl,sizesCsv,stockQty
Nike Air Max 90,Nike,"Iconic waffle sole, visible Air unit. A timeless classic.",10995,https://static.nike.com/a/images/t_PDP_1280_v1/air-max-90.png,6,7,8,9,10,11,12,45
Nike Air Force 1 '07,Nike,"The shoe that started it all. Crisp leather, bold sole.",8495,https://static.nike.com/a/images/t_PDP_1280_v1/air-force-1-07.png,6,7,8,9,10,11,30
Nike Dunk Low,Nike,"Street and skate heritage. Clean colourways, grippy sole.",9495,...
...
```

**20 products across 7 brands** (realistic Indian market prices, 2025):

| # | Name | Brand | Price (INR) | Stock |
|---|------|-------|-------------|-------|
| 1 | Air Max 90 | Nike | ₹10,995 | 45 |
| 2 | Air Force 1 '07 | Nike | ₹8,495 | 30 |
| 3 | Dunk Low Retro | Nike | ₹9,495 | 25 |
| 4 | Ultraboost 22 | Adidas | ₹14,999 | 20 |
| 5 | Stan Smith | Adidas | ₹7,999 | 40 |
| 6 | Superstar | Adidas | ₹6,999 | 35 |
| 7 | Forum Low | Adidas | ₹8,499 | 18 |
| 8 | Chuck 70 High | Converse | ₹5,995 | 50 |
| 9 | Run Star Hike | Converse | ₹7,495 | 22 |
| 10 | Old Skool | Vans | ₹5,499 | 60 |
| 11 | Sk8-Hi | Vans | ₹6,299 | 28 |
| 12 | RS-X³ Puzzle | Puma | ₹8,999 | 15 |
| 13 | Suede Classic | Puma | ₹5,999 | 32 |
| 14 | Gel-Kayano 29 | ASICS | ₹12,999 | 12 |
| 15 | Gel-Nimbus 24 | ASICS | ₹14,499 | 10 |
| 16 | 574 Core | New Balance | ₹7,495 | 38 |
| 17 | 990v5 Made in USA | New Balance | ₹19,995 | 8 |
| 18 | 550 Basketball | New Balance | ₹8,995 | 20 |
| 19 | Air Jordan 1 Low | Nike | ₹8,995 | 15 |
| 20 | ZX 8000 | Adidas | ₹9,999 | 0 |

> Product #20 (ZX 8000) is intentionally out-of-stock to demonstrate the out-of-stock UI.

---

## Part B — Backend: CSV Import Endpoint

### `POST /api/admin/products/import` (admin only)

Accepts `multipart/form-data` with a `file` field containing a UTF-8 CSV.

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>

file: products.csv
```

**Response (200):**
```json
{
  "imported": 20,
  "skipped": 0,
  "errors": []
}
```

### Implementation

**`backend/src/main/java/com/mystreet/product/CsvImportResult.java`**
```java
public record CsvImportResult(int imported, int skipped, List<String> errors) {}
```

**`backend/src/main/java/com/mystreet/product/ProductImportService.java`**
```java
@Service
@Transactional
public class ProductImportService {

    private final ProductRepository productRepository;

    public CsvImportResult importCsv(MultipartFile file) throws IOException {
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine(); // skip header
            if (headerLine == null) return new CsvImportResult(0, 0, List.of("Empty file"));

            String line;
            int row = 1;
            while ((line = reader.readLine()) != null) {
                row++;
                try {
                    String[] cols = parseCsvLine(line);
                    // cols: name,brand,description,price,imageUrl,sizesCsv,stockQty
                    Product p = new Product();
                    p.setName(cols[0].trim());
                    p.setBrand(cols[1].trim());
                    p.setDescription(cols[2].trim().isEmpty() ? null : cols[2].trim());
                    p.setPrice(new BigDecimal(cols[3].trim()));
                    p.setImageUrl(cols[4].trim().isEmpty() ? null : cols[4].trim());
                    p.setSizesCsv(cols[5].trim().isEmpty() ? null : cols[5].trim());
                    p.setStockQty(Integer.parseInt(cols[6].trim()));
                    productRepository.save(p);
                    imported++;
                } catch (Exception e) {
                    errors.add("Row " + row + ": " + e.getMessage());
                    skipped++;
                }
            }
        }
        return new CsvImportResult(imported, skipped, errors);
    }

    // Handles quoted fields with commas inside
    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { result.add(current.toString()); current = new StringBuilder(); }
            else { current.append(c); }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}
```

**`backend/src/main/java/com/mystreet/product/ProductController.java`** — add endpoint:
```java
@PostMapping(value = "/admin/products/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<CsvImportResult> importCsv(@RequestParam("file") MultipartFile file) {
    if (!AuthUtils.isCurrentUserAdmin()) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    try {
        return ResponseEntity.ok(productImportService.importCsv(file));
    } catch (IOException e) {
        return ResponseEntity.badRequest().build();
    }
}
```

Also add to `SecurityConfig` — `/api/admin/**` requires auth (already covered by `anyRequest().authenticated()`).

---

## Part C — Admin Frontend: Import Button

Add to `AdminProductsPage`:

```typescript
// File input → POST to /api/admin/products/import → refresh product list
<label className="cursor-pointer">
  <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
  <Button variant="outline" asChild><span>Import CSV</span></Button>
</label>
```

On success, invalidate `['products']` query key so the list page refreshes automatically.

---

## Part D — Image Strategy

Real sneaker images require CDN links. Use these stable, publicly accessible sources:

| Source | Example URL |
|--------|-------------|
| Nike CDN | `https://static.nike.com/a/images/t_PDP_1280_v1/...` |
| Adidas media | `https://assets.adidas.com/images/...` |
| Puma media | `https://images.puma.com/image/...` |
| Unsplash (fallback) | `https://images.unsplash.com/photo-...?w=600` |

**Fallback:** If brand CDNs block hotlinking in prod, the no-image state ("No image") renders cleanly. We will verify image URLs manually before putting the final CSV.

---

## When to do this spec

Run SPEC-13 **after SPEC-10 (admin frontend) is complete** — the import button lives in the admin panel. The CSV file itself can be prepared at any time.

---

## Acceptance Criteria

- [ ] `data/products.csv` exists at repo root with 20 real sneakers
- [ ] `POST /api/admin/products/import` accepts CSV, returns `{ imported, skipped, errors }`
- [ ] Admin UI has "Import CSV" button that calls the endpoint
- [ ] After import, product list page shows real names + realistic prices
- [ ] At least one product has a working image URL visible in the browser
- [ ] Product #20 (ZX 8000, stock=0) shows "Out of Stock" state
