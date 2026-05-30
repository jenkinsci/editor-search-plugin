package io.jenkins.plugins.editorsearch;

import hudson.Extension;
import hudson.model.PageDecorator;

@Extension
public class EditorSearchPageDecorator extends PageDecorator {

    @Override
    public String getDisplayName() {
        return "Editor Search";
    }
}
