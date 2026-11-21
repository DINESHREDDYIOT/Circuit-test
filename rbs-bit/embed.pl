#!/usr/bin/env perl
# Copies rbs-bit.js into index.html's <script type="module" id="rbs-bit-lib"> block, so the one-file lab carries the
# same board model as the module. Run from the repo root (build.sh does): perl rbs-bit/embed.pl index.html rbs-bit/rbs-bit.js
use strict; use warnings;
my ($html, $js) = @ARGV; $html //= 'index.html'; $js //= 'rbs-bit/rbs-bit.js';
local $/;
open my $h, '<:encoding(UTF-8)', $html or die "$html: $!\n"; my $s = <$h>; close $h;
open my $j, '<:encoding(UTF-8)', $js or die "$js: $!\n"; my $code = <$j>; close $j;
die "$js contains a closing script tag\n" if $code =~ m{</script}i;
$code =~ s/\s+\z/\n/;
my $open = '<script type="module" id="rbs-bit-lib">';
my $block = "$open\n$code" . "window.RBS_BIT = { createRBSBit, RBS_BIT_SPEC, RBS_BIT_VIEWS, RBS_BIT_COLORS, RBS_BIT_DESIGN_COLORS };\n</script>";
my $at = index($s, $open);
if ($at >= 0) {   # replace the copy that is there
  my $end = index($s, '</script>', $at); die "the rbs-bit-lib block in $html is not closed\n" if $end < 0;
  substr($s, $at, $end + length('</script>') - $at) = $block;
} else {          # first time: put it just before the lab's main module
  my $main = index($s, "\n<script type=\"module\">\n"); die "no main module script found in $html\n" if $main < 0;
  substr($s, $main + 1, 0) = "$block\n";
}
open my $o, '>:encoding(UTF-8)', $html or die "$html: $!\n"; print $o $s; close $o;
print "embedded $js into $html\n";
