package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByIdIgnoreCase(String id);
    
    Optional<User> findByIdIgnoreCaseAndPassword(String id, String password);
    
    Optional<User> findByIdIgnoreCaseAndRole(String id, String role);
} 