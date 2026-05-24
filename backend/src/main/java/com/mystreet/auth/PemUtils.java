package com.mystreet.auth;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class PemUtils {

    private PemUtils() {}

    static PublicKey readPublicKey(Resource resource)
            throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        String pem = resource.getContentAsString(StandardCharsets.UTF_8);
        byte[] der = decodePem(pem);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    }

    static PrivateKey readPrivateKey(Resource resource)
            throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        String pem = resource.getContentAsString(StandardCharsets.UTF_8);
        byte[] der = decodePem(pem);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private static byte[] decodePem(String pem) {
        String stripped = pem
            .replaceAll("-----BEGIN [A-Z ]+-----", "")
            .replaceAll("-----END [A-Z ]+-----", "")
            .replaceAll("\\s+", "");
        return Base64.getDecoder().decode(stripped);
    }
}
