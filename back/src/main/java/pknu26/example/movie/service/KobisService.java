package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import pknu26.example.movie.dto.*;
import pknu26.example.movie.entity.*;
import pknu26.example.movie.repository.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KobisService {

    private static final String DAILY_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json";
    private static final String WEEKLY_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json";
    private static final String CODE_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/code/searchCodeList.json";
    private static final String MOVIE_LIST_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json";
    private static final String MOVIE_INFO_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json";

    private static final int RETENTION_DAYS = 365;
    private static final LocalDate DATA_START_DATE = LocalDate.of(2025, 6, 19);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter COMPACT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String[] CODE_CATEGORIES = {"2105", "2101", "2201"};

    @Value("${kobis.api.key}")
    private String apiKey;

    private final DailyBoxOfficeRepository dailyRepo;
    private final WeeklyBoxOfficeRepository weeklyRepo;
    private final KobisMovieRepository movieRepo;
    private final KobisCodeRepository codeRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    // ══════════════════════════════════════════════
    // 일별 박스오피스 (기존)
    // ══════════════════════════════════════════════

    @Transactional
    public List<BoxOfficeEntryDto> getDailyBoxOffice(String date) {
        String targetDate = resolveDate(date);
        if (!dailyRepo.existsByDate(targetDate)) {
            log.info("일별 박스오피스 DB 미존재, API 수집: {}", targetDate);
            collectDailySingle(targetDate);
        }
        return dailyRepo.findByDateOrderByRankAsc(targetDate)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableDates() {
        return dailyRepo.findDistinctDatesDesc();
    }

    // ══════════════════════════════════════════════
    // 주간/주말 박스오피스 조회
    // ══════════════════════════════════════════════

    @Transactional
    public List<WeeklyBoxOffice> getWeeklyBoxOffice(String showRange, String weekGb) {
        if (!weeklyRepo.existsByShowRangeAndWeekGb(showRange, weekGb)) {
            log.info("주간 박스오피스 DB 미존재, API 수집: {} weekGb={}", showRange, weekGb);
            // showRange = "YYYYMMDD~YYYYMMDD" → [0] 이 월요일(시작일), KOBIS는 월요일을 targetDt로 기대함
            String targetDt = showRange.contains("~") ? showRange.split("~")[0] : showRange;
            collectWeeklySingleForced(targetDt, weekGb, showRange);
        }
        return weeklyRepo.findByShowRangeAndWeekGbOrderByRankAsc(showRange, weekGb);
    }

    @Transactional(readOnly = true)
    public List<String> getWeeklyRanges(String weekGb) {
        return weeklyRepo.findDistinctShowRangesByWeekGb(weekGb);
    }

    // ══════════════════════════════════════════════
    // 주간 박스오피스 트렌드 분석
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public TrendAnalysisDto getWeeklyTrends() {
        List<WeeklyBoxOffice> all = weeklyRepo.findAll().stream()
                .filter(w -> "0".equals(w.getWeekGb()))
                .collect(Collectors.toList());

        return TrendAnalysisDto.builder()
                .monthly(aggregateByMonth(all))
                .seasonal(aggregateBySeason(all))
                .build();
    }

    private List<WeeklyTrendDto> aggregateByMonth(List<WeeklyBoxOffice> data) {
        Map<String, List<WeeklyBoxOffice>> grouped = new TreeMap<>();
        for (WeeklyBoxOffice w : data) {
            String month = extractMonth(w.getShowRange());
            if (month != null) {
                grouped.computeIfAbsent(month, k -> new ArrayList<>()).add(w);
            }
        }
        return grouped.entrySet().stream()
                .map(e -> buildTrend(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<WeeklyTrendDto> aggregateBySeason(List<WeeklyBoxOffice> data) {
        Map<String, List<WeeklyBoxOffice>> grouped = new TreeMap<>();
        for (WeeklyBoxOffice w : data) {
            String season = extractSeason(w.getShowRange());
            if (season != null) {
                grouped.computeIfAbsent(season, k -> new ArrayList<>()).add(w);
            }
        }
        return grouped.entrySet().stream()
                .map(e -> buildTrend(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private WeeklyTrendDto buildTrend(String period, List<WeeklyBoxOffice> items) {
        long totalSales = items.stream().mapToLong(WeeklyBoxOffice::getSalesAmt).sum();
        long totalAudi = items.stream().mapToLong(WeeklyBoxOffice::getAudiCnt).sum();
        long avgScreens = items.isEmpty() ? 0 : items.stream().mapToLong(WeeklyBoxOffice::getScrnCnt).sum() / items.size();
        long movieCount = items.stream().map(WeeklyBoxOffice::getMovieNm).distinct().count();

        String topMovie = items.stream()
                .collect(Collectors.groupingBy(WeeklyBoxOffice::getMovieNm, Collectors.summingLong(WeeklyBoxOffice::getAudiCnt)))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("");

        return WeeklyTrendDto.builder()
                .period(period)
                .totalSales(totalSales)
                .totalAudience(totalAudi)
                .movieCount((int) movieCount)
                .topMovie(topMovie)
                .avgScreens(avgScreens)
                .build();
    }

    private String extractMonth(String showRange) {
        if (showRange == null || showRange.length() < 8) return null;
        String start = showRange.substring(0, 8);
        return start.substring(0, 4) + "-" + start.substring(4, 6);
    }

    private String extractSeason(String showRange) {
        if (showRange == null || showRange.length() < 8) return null;
        String start = showRange.substring(0, 8);
        String year = start.substring(0, 4);
        int month = Integer.parseInt(start.substring(4, 6));
        if (month >= 3 && month <= 5) return year + " 봄";
        if (month >= 6 && month <= 8) return year + " 여름";
        if (month >= 9 && month <= 11) return year + " 가을";
        return year + " 겨울";
    }

    // ══════════════════════════════════════════════
    // 파생 통계 (스크린당 관객수, 상영회차당 관객수, 점유율)
    // ══════════════════════════════════════════════

    @Transactional
    public List<DerivedStatsDto> getDerivedStats(String date) {
        String targetDate = resolveDate(date);
        if (!dailyRepo.existsByDate(targetDate)) {
            collectDailySingle(targetDate);
        }
        List<DailyBoxOffice> entries = dailyRepo.findByDateOrderByRankAsc(targetDate);
        long totalScreens = entries.stream().mapToLong(DailyBoxOffice::getScrnCnt).sum();

        return entries.stream().map(e -> {
            int days = calcDaysSinceRelease(targetDate, e.getOpenDt());
            double audiPerScreen = e.getScrnCnt() > 0 ? (double) e.getAudiCnt() / e.getScrnCnt() : 0;
            double audiPerShow = e.getShowCnt() > 0 ? (double) e.getAudiCnt() / e.getShowCnt() : 0;
            double screenShare = totalScreens > 0 ? (double) e.getScrnCnt() / totalScreens * 100 : 0;

            return DerivedStatsDto.builder()
                    .rank(e.getRank())
                    .movieNm(e.getMovieNm())
                    .openDt(e.getOpenDt())
                    .daysSinceRelease(days)
                    .audiCnt(e.getAudiCnt())
                    .scrnCnt(e.getScrnCnt())
                    .showCnt(e.getShowCnt())
                    .audiPerScreen(Math.round(audiPerScreen * 10.0) / 10.0)
                    .audiPerShow(Math.round(audiPerShow * 10.0) / 10.0)
                    .screenShare(Math.round(screenShare * 100.0) / 100.0)
                    .salesShare(e.getSalesShare())
                    .build();
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════
    // 영화 추적 (개봉 주차별 누적 관객 추이)
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<MovieTrackingDto> getMovieTracking(String movieNm) {
        List<DailyBoxOffice> entries = dailyRepo.findByMovieNmOrderByDateAsc(movieNm);
        if (entries.isEmpty()) return Collections.emptyList();

        String openDt = entries.get(0).getOpenDt();

        return entries.stream().map(e -> {
            int days = calcDaysSinceRelease(e.getDate(), openDt);
            int week = days / 7 + 1;
            double audiPerScreen = e.getScrnCnt() > 0 ? (double) e.getAudiCnt() / e.getScrnCnt() : 0;
            double audiPerShow = e.getShowCnt() > 0 ? (double) e.getAudiCnt() / e.getShowCnt() : 0;

            return MovieTrackingDto.builder()
                    .date(e.getDate())
                    .daysSinceRelease(days)
                    .weekNumber(week)
                    .audiCnt(e.getAudiCnt())
                    .audiAcc(e.getAudiAcc())
                    .salesAmt(e.getSalesAmt())
                    .salesAcc(e.getSalesAcc())
                    .scrnCnt(e.getScrnCnt())
                    .showCnt(e.getShowCnt())
                    .audiPerScreen(Math.round(audiPerScreen * 10.0) / 10.0)
                    .audiPerShow(Math.round(audiPerShow * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getTrackableMovieNames() {
        return dailyRepo.findDistinctMovieNames();
    }

    // ══════════════════════════════════════════════
    // 역대 흥행 순위
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AllTimeRankingDto> getAllTimeRankings(String sortBy, int limit) {
        List<DailyBoxOffice> all = dailyRepo.findAll();

        Map<String, List<DailyBoxOffice>> grouped = all.stream()
                .collect(Collectors.groupingBy(DailyBoxOffice::getMovieNm));

        List<AllTimeRankingDto> rankings = grouped.entrySet().stream()
                .map(entry -> {
                    List<DailyBoxOffice> items = entry.getValue();
                    long maxAudi = items.stream().mapToLong(DailyBoxOffice::getAudiAcc).max().orElse(0);
                    long maxSales = items.stream().mapToLong(DailyBoxOffice::getSalesAcc).max().orElse(0);
                    String openDt = items.get(0).getOpenDt();
                    return AllTimeRankingDto.builder()
                            .movieNm(entry.getKey())
                            .openDt(openDt)
                            .maxAudiAcc(maxAudi)
                            .maxSalesAcc(maxSales)
                            .build();
                })
                .sorted((a, b) -> "sales".equals(sortBy)
                        ? Long.compare(b.getMaxSalesAcc(), a.getMaxSalesAcc())
                        : Long.compare(b.getMaxAudiAcc(), a.getMaxAudiAcc()))
                .limit(limit)
                .collect(Collectors.toList());

        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }
        return rankings;
    }

    // ── 날짜 차이 계산 ──

    private int calcDaysSinceRelease(String currentDate, String openDt) {
        try {
            LocalDate current = LocalDate.parse(currentDate, FMT);
            String normalizedOpenDt = openDt;
            if (openDt != null && openDt.length() == 8 && !openDt.contains("-")) {
                normalizedOpenDt = openDt.substring(0, 4) + "-" + openDt.substring(4, 6) + "-" + openDt.substring(6, 8);
            }
            LocalDate open = LocalDate.parse(normalizedOpenDt, FMT);
            return (int) java.time.temporal.ChronoUnit.DAYS.between(open, current);
        } catch (Exception e) {
            return 0;
        }
    }

    // ══════════════════════════════════════════════
    // 공통코드 조회
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<KobisCode> getCodes(String comCode) {
        return codeRepo.findByComCode(comCode);
    }

    // ══════════════════════════════════════════════
    // 영화목록/상세 조회
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<KobisMovie> getKobisMovies() {
        return movieRepo.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<KobisMovie> getKobisMovie(String movieCd) {
        return movieRepo.findById(movieCd);
    }

    // ══════════════════════════════════════════════
    // 스케줄러 & 백필
    // ══════════════════════════════════════════════

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void scheduledCollect() {
        log.info("[스케줄러] 일별 박스오피스 수집 시작");
        String yesterday = LocalDate.now().minusDays(1).format(FMT);
        collectDailySingle(yesterday);
        purgeOldData();
        log.info("[스케줄러] 수집 완료");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void backfillOnStartup() {
        log.info("[백필] 전체 데이터 수집 시작 ({}~)", DATA_START_DATE);
        backfillDaily();
        backfillWeekly();
        collectCodes();
        collectMovieList();
        log.info("[백필] 전체 데이터 수집 완료");
    }

    @Transactional
    public Map<String, Integer> manualCollectAll() {
        Map<String, Integer> result = new LinkedHashMap<>();
        result.put("daily", backfillDaily());
        result.put("weekly", backfillWeekly());
        result.put("codes", collectCodes());
        result.put("movies", collectMovieList());
        purgeOldData();
        return result;
    }

    // ── 일별 백필 ──

    private int backfillDaily() {
        int collected = 0;
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate cursor = DATA_START_DATE;
        while (!cursor.isAfter(yesterday)) {
            String date = cursor.format(FMT);
            if (!dailyRepo.existsByDate(date)) {
                collectDailySingle(date);
                collected++;
            }
            cursor = cursor.plusDays(1);
        }
        if (collected > 0) log.info("[백필] 일별 {}일치 수집", collected);
        return collected;
    }

    private void collectDailySingle(String targetDate) {
        if (dailyRepo.existsByDate(targetDate)) return;
        try {
            String url = DAILY_URL + "?key=" + apiKey + "&targetDt=" + targetDate.replace("-", "");
            KobisBoxOfficeResponse resp = restTemplate.getForObject(url, KobisBoxOfficeResponse.class);
            if (resp == null || resp.getBoxOfficeResult() == null
                    || resp.getBoxOfficeResult().getDailyBoxOfficeList() == null) return;

            List<DailyBoxOffice> entities = resp.getBoxOfficeResult().getDailyBoxOfficeList().stream()
                    .map(item -> DailyBoxOffice.builder()
                            .date(targetDate)
                            .rank(parsInt(item.getRank()))
                            .rankInten(parsInt(item.getRankInten()))
                            .rankOldAndNew(item.getRankOldAndNew())
                            .movieNm(item.getMovieNm())
                            .openDt(item.getOpenDt())
                            .salesAmt(parsLong(item.getSalesAmt()))
                            .salesShare(parsDouble(item.getSalesShare()))
                            .salesInten(parsLong(item.getSalesInten()))
                            .salesChange(parsDouble(item.getSalesChange()))
                            .salesAcc(parsLong(item.getSalesAcc()))
                            .audiCnt(parsLong(item.getAudiCnt()))
                            .audiInten(parsLong(item.getAudiInten()))
                            .audiChange(parsDouble(item.getAudiChange()))
                            .audiAcc(parsLong(item.getAudiAcc()))
                            .scrnCnt(parsLong(item.getScrnCnt()))
                            .showCnt(parsLong(item.getShowCnt()))
                            .build())
                    .collect(Collectors.toList());
            if (!entities.isEmpty()) {
                dailyRepo.saveAll(entities);
                log.info("  일별 {} — {}편", targetDate, entities.size());
            }
            Thread.sleep(300);
        } catch (Exception e) {
            log.warn("  일별 {} 실패: {}", targetDate, e.getMessage());
        }
    }

    // ── 주간/주말 백필 ──

    private int backfillWeekly() {
        int collected = 0;
        LocalDate start = DATA_START_DATE.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate lastSunday = yesterday.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));

        LocalDate monday = start;
        while (!monday.isAfter(lastSunday)) {
            String targetDt = monday.format(COMPACT);
            String showRange = monday.format(COMPACT) + "~" + monday.plusDays(6).format(COMPACT);

            for (String weekGb : new String[]{"0", "1"}) {
                if (!weeklyRepo.existsByShowRangeAndWeekGb(showRange, weekGb)) {
                    collected += collectWeeklySingle(targetDt, weekGb, showRange);
                }
            }
            monday = monday.plusWeeks(1);
        }
        if (collected > 0) log.info("[백필] 주간/주말 {}건 수집", collected);
        return collected;
    }

    private int collectWeeklySingle(String targetDt, String weekGb, String showRange) {
        try {
            String url = WEEKLY_URL + "?key=" + apiKey + "&targetDt=" + targetDt + "&weekGb=" + weekGb;
            KobisWeeklyResponse resp = restTemplate.getForObject(url, KobisWeeklyResponse.class);
            if (resp == null || resp.getBoxOfficeResult() == null
                    || resp.getBoxOfficeResult().getWeeklyBoxOfficeList() == null) return 0;

            String actualRange = resp.getBoxOfficeResult().getShowRange();
            if (actualRange == null) actualRange = showRange;

            String finalRange = actualRange;
            List<WeeklyBoxOffice> entities = resp.getBoxOfficeResult().getWeeklyBoxOfficeList().stream()
                    .map(item -> WeeklyBoxOffice.builder()
                            .showRange(finalRange)
                            .weekGb(weekGb)
                            .rank(parsInt(item.getRank()))
                            .movieCd(item.getMovieCd())
                            .movieNm(item.getMovieNm())
                            .openDt(item.getOpenDt())
                            .salesAmt(parsLong(item.getSalesAmt()))
                            .salesShare(parsDouble(item.getSalesShare()))
                            .salesAcc(parsLong(item.getSalesAcc()))
                            .audiCnt(parsLong(item.getAudiCnt()))
                            .audiAcc(parsLong(item.getAudiAcc()))
                            .scrnCnt(parsLong(item.getScrnCnt()))
                            .showCnt(parsLong(item.getShowCnt()))
                            .build())
                    .collect(Collectors.toList());

            if (!entities.isEmpty()) {
                weeklyRepo.saveAll(entities);
                String label = weekGb.equals("0") ? "주간" : "주말";
                log.info("  {} {} — {}편", label, finalRange, entities.size());
            }
            Thread.sleep(300);
            return entities.size();
        } catch (Exception e) {
            log.warn("  주간 {} (weekGb={}) 실패: {}", targetDt, weekGb, e.getMessage());
            return 0;
        }
    }

    // on-demand 조회용: actualRange 무시하고 요청한 showRange 그대로 저장. KOBIS 에러 시 예외 전파.
    private void collectWeeklySingleForced(String targetDt, String weekGb, String showRange) {
        try {
            String url = WEEKLY_URL + "?key=" + apiKey + "&targetDt=" + targetDt + "&weekGb=" + weekGb;
            KobisWeeklyResponse resp = restTemplate.getForObject(url, KobisWeeklyResponse.class);

            if (resp != null && resp.getFaultInfo() != null) {
                String msg = resp.getFaultInfo().getMessage();
                log.warn("  KOBIS API 오류 (weekGb={}): {}", weekGb, msg);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "KOBIS API 오류: " + msg);
            }

            if (resp == null || resp.getBoxOfficeResult() == null
                    || resp.getBoxOfficeResult().getWeeklyBoxOfficeList() == null) return;

            List<WeeklyBoxOffice> entities = resp.getBoxOfficeResult().getWeeklyBoxOfficeList().stream()
                    .map(item -> WeeklyBoxOffice.builder()
                            .showRange(showRange)
                            .weekGb(weekGb)
                            .rank(parsInt(item.getRank()))
                            .movieCd(item.getMovieCd())
                            .movieNm(item.getMovieNm())
                            .openDt(item.getOpenDt())
                            .salesAmt(parsLong(item.getSalesAmt()))
                            .salesShare(parsDouble(item.getSalesShare()))
                            .salesAcc(parsLong(item.getSalesAcc()))
                            .audiCnt(parsLong(item.getAudiCnt()))
                            .audiAcc(parsLong(item.getAudiAcc()))
                            .scrnCnt(parsLong(item.getScrnCnt()))
                            .showCnt(parsLong(item.getShowCnt()))
                            .build())
                    .collect(Collectors.toList());

            if (!entities.isEmpty()) {
                weeklyRepo.saveAll(entities);
                String label = weekGb.equals("0") ? "주간" : "주말";
                log.info("  {} {} — {}편 (on-demand)", label, showRange, entities.size());
            }
            Thread.sleep(300);
        } catch (ResponseStatusException e) {
            throw e;  // KOBIS 에러는 그대로 전파
        } catch (Exception e) {
            log.warn("  주간 {} (weekGb={}) 실패: {}", targetDt, weekGb, e.getMessage());
        }
    }

    // ── 공통코드 수집 ──

    private int collectCodes() {
        if (codeRepo.count() > 0) {
            log.info("[코드] 이미 존재 — 건너뜀");
            return 0;
        }
        int total = 0;
        for (String comCode : CODE_CATEGORIES) {
            try {
                String url = CODE_URL + "?key=" + apiKey + "&comCode=" + comCode;
                KobisCodeResponse resp = restTemplate.getForObject(url, KobisCodeResponse.class);
                if (resp == null || resp.getCodes() == null) continue;

                List<KobisCode> entities = resp.getCodes().stream()
                        .map(item -> KobisCode.builder()
                                .comCode(comCode)
                                .fullCd(item.getFullCd())
                                .korNm(item.getKorNm())
                                .build())
                        .collect(Collectors.toList());
                codeRepo.saveAll(entities);
                total += entities.size();
                log.info("  코드 {} — {}건", comCode, entities.size());
                Thread.sleep(300);
            } catch (Exception e) {
                log.warn("  코드 {} 실패: {}", comCode, e.getMessage());
            }
        }
        return total;
    }

    // ── 영화목록 + 상세정보 수집 ──

    private int collectMovieList() {
        if (movieRepo.count() > 0) {
            log.info("[영화목록] 이미 존재 — 건너뜀");
            return 0;
        }
        int prdtStartYear = DATA_START_DATE.getYear() - 1;
        int prdtEndYear = LocalDate.now().getYear();
        int totalCollected = 0;

        try {
            int totalPages = Integer.MAX_VALUE;
            for (int page = 1; page <= totalPages; page++) {
                String url = MOVIE_LIST_URL + "?key=" + apiKey
                        + "&prdtStartYear=" + prdtStartYear + "&prdtEndYear=" + prdtEndYear
                        + "&curPage=" + page + "&itemPerPage=100";
                KobisMovieListResponse resp = restTemplate.getForObject(url, KobisMovieListResponse.class);
                if (resp == null || resp.getMovieListResult() == null
                        || resp.getMovieListResult().getMovieList() == null) break;

                if (page == 1) {
                    int totCnt = resp.getMovieListResult().getTotCnt();
                    totalPages = (totCnt + 99) / 100;
                    log.info("[영화목록] 총 {}편, {}페이지 수집 시작 ({}~{}년)",
                            totCnt, totalPages, prdtStartYear, prdtEndYear);
                }

                List<KobisMovieListResponse.MovieItem> items = resp.getMovieListResult().getMovieList();
                if (items.isEmpty()) break;

                for (KobisMovieListResponse.MovieItem item : items) {
                    if (movieRepo.existsById(item.getMovieCd())) continue;

                    KobisMovie movie = KobisMovie.builder()
                            .movieCd(item.getMovieCd())
                            .movieNm(item.getMovieNm())
                            .movieNmEn(item.getMovieNmEn())
                            .prdtYear(item.getPrdtYear())
                            .openDt(item.getOpenDt())
                            .typeNm(item.getTypeNm())
                            .prdtStatNm(item.getPrdtStatNm())
                            .nationAlt(item.getNationAlt())
                            .genreAlt(item.getGenreAlt())
                            .build();

                    enrichWithDetail(movie);
                    movieRepo.save(movie);
                    totalCollected++;
                    Thread.sleep(300);
                }

                log.info("  영화목록 페이지 {}/{} — 누적 {}편", page, totalPages, totalCollected);

                if (items.size() < 100) break;
                Thread.sleep(300);
            }
        } catch (Exception e) {
            log.warn("  영화목록 수집 실패: {}", e.getMessage());
        }

        if (totalCollected > 0) log.info("[백필] 영화 {}편 수집 (상세정보 포함)", totalCollected);
        return totalCollected;
    }

    private void enrichWithDetail(KobisMovie movie) {
        try {
            String url = MOVIE_INFO_URL + "?key=" + apiKey + "&movieCd=" + movie.getMovieCd();
            KobisMovieInfoResponse resp = restTemplate.getForObject(url, KobisMovieInfoResponse.class);
            if (resp == null || resp.getMovieInfoResult() == null
                    || resp.getMovieInfoResult().getMovieInfo() == null) return;

            KobisMovieInfoResponse.MovieInfo info = resp.getMovieInfoResult().getMovieInfo();
            movie.setShowTm(parsIntOrNull(info.getShowTm()));

            if (info.getDirectors() != null) {
                movie.setDirectors(info.getDirectors().stream()
                        .map(KobisMovieInfoResponse.Director::getPeopleNm)
                        .collect(Collectors.joining(", ")));
            }
            if (info.getActors() != null) {
                movie.setActors(info.getActors().stream()
                        .limit(5)
                        .map(a -> a.getPeopleNm() + (a.getCast() != null ? "(" + a.getCast() + ")" : ""))
                        .collect(Collectors.joining(", ")));
            }
            if (info.getCompanys() != null) {
                movie.setCompanys(info.getCompanys().stream()
                        .map(KobisMovieInfoResponse.Company::getCompanyNm)
                        .collect(Collectors.joining(", ")));
            }
            if (info.getAudits() != null && !info.getAudits().isEmpty()) {
                movie.setWatchGradeNm(info.getAudits().get(0).getWatchGradeNm());
            }
        } catch (Exception e) {
            log.warn("  상세 {} 실패: {}", movie.getMovieCd(), e.getMessage());
        }
    }

    // ── 삭제 ──

    private void purgeOldData() {
        String cutoff = LocalDate.now().minusDays(RETENTION_DAYS + 1).format(FMT);
        int deleted = dailyRepo.deleteByDateBefore(cutoff);
        if (deleted > 0) log.info("  {}일 이전 일별 데이터 {}건 삭제", RETENTION_DAYS, deleted);
    }

    // ── 변환 ──

    private BoxOfficeEntryDto toDto(DailyBoxOffice e) {
        return BoxOfficeEntryDto.builder()
                .rank(e.getRank()).rankInten(e.getRankInten()).rankOldAndNew(e.getRankOldAndNew())
                .movieNm(e.getMovieNm()).openDt(e.getOpenDt())
                .salesAmt(e.getSalesAmt()).salesShare(e.getSalesShare())
                .salesInten(e.getSalesInten()).salesChange(e.getSalesChange()).salesAcc(e.getSalesAcc())
                .audiCnt(e.getAudiCnt()).audiInten(e.getAudiInten())
                .audiChange(e.getAudiChange()).audiAcc(e.getAudiAcc())
                .scrnCnt(e.getScrnCnt()).showCnt(e.getShowCnt()).date(e.getDate())
                .build();
    }

    private String resolveDate(String date) {
        return (date != null && !date.isEmpty()) ? date : LocalDate.now().minusDays(1).format(FMT);
    }

    private int parsInt(String s) { try { return Integer.parseInt(s); } catch (Exception e) { return 0; } }
    private long parsLong(String s) { try { return Long.parseLong(s); } catch (Exception e) { return 0L; } }
    private double parsDouble(String s) { try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; } }
    private Integer parsIntOrNull(String s) { try { return Integer.parseInt(s); } catch (Exception e) { return null; } }
}
