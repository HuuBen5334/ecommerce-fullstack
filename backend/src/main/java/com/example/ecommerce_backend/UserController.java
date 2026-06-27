package com.example.ecommerce_backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    // Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll(Sort.by("id").ascending());
    }
    // Get individual user
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user){
        User saved = userRepository.save(user);
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).build();
        }
    }

    // Update User
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updated) {
        // Fetch existing user
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        // Update user
        user.setName(updated.getName());
        user.setEmail(updated.getEmail());

        return ResponseEntity.ok(userRepository.save(user));
    }

}
