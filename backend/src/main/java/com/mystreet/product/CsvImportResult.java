package com.mystreet.product;

import java.util.List;

public record CsvImportResult(int imported, int skipped, List<String> errors) {}
