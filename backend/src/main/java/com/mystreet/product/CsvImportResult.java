package com.mystreet.product;

import java.util.List;

public record CsvImportResult(int inserted, int updated, int skipped, List<String> errors) {}
