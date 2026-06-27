package pknu26.example.movie.controller;

import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pknu26.example.movie.entity.TmdbMovie;
import pknu26.example.movie.entity.NoDoubleSubmit;
import pknu26.example.movie.service.BoardService;

@RestController
@RequestMapping("/board")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public List<TmdbMovie> list(@RequestParam(name = "keyword", required = false) String keyword) {
        if (keyword != null && !keyword.isEmpty()) {
            return boardService.searchMovies(keyword);
        } else {
            return boardService.getAllMovies();
        }
    }

    @GetMapping("/{id}")
    public TmdbMovie detail(@PathVariable("id") Long id) {
        return boardService.getMovie(id);
    }

    @PostMapping("/add")
    @NoDoubleSubmit
    public String add(@RequestBody TmdbMovie movie) {
        boardService.saveMovie(movie);
        return "Success";
    }

    @PostMapping("/edit/{id}")
    @NoDoubleSubmit
    public String edit(@PathVariable("id") Long id, @RequestBody TmdbMovie movie) {
        movie.setId(id);
        boardService.saveMovie(movie);
        return "Success";
    }

    @PostMapping("/delete/{id}")
    public String delete(@PathVariable("id") Long id) {
        boardService.deleteMovie(id);
        return "Success";
    }
}
