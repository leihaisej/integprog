package com.example.integprog;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller

public class IntegprogController {

@GetMapping("/home")
public String home() {
	return "/lei/integ_home.html";
}
}
